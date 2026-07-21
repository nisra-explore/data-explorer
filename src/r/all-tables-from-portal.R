library(jsonlite)
library(dplyr)

api_key <- "801aaca4bcf0030599c019f4efa8b89032e5e6aa1de4a629a7f7e9a86db7fb8c"

# Fetch dataset function ####

fetch_dataset <- function(matrix,
                          api_key,
                          label = NULL,
                          max_attempts = Inf,
                          wait_seconds = 2) {
  attempt <- 1
  repeat {
    result <- tryCatch(
      {

        url <- paste0(
          "https://ws-data.nisra.gov.uk/public/api.jsonrpc",
          "?data=%7B%22jsonrpc%22:%222.0%22,%22method%22:",
          "%22PxStat.Data.Cube_API.ReadDataset%22,",
          "%22params%22:%7B%22class%22:%22query%22,%22id%22:%5B%5D,",
          "%22dimension%22:%7B%7D,%22extension%22:%7B%22pivot%22:null,",
          "%22codes%22:false,%22language%22:%7B%22code%22:%22en%22%7D,",
          "%22format%22:%7B%22type%22:%22JSON-stat%22,",
          "%22version%22:%222.0%22%7D,%22matrix%22:%22",
          matrix,
          "%22%7D,%22version%22:%222.0%22%7D%7D&apiKey=",
          api_key
        )

        json_data <- fromJSON(txt = url)

        # Check if API itself returned "error" field
        if ("error" %in% names(json_data)) {
          stop("API returned error field")
        }

        return(json_data)  # ✅ success, return immediately
      },
      error = function(e) {
        message(sprintf("Error fetching %s (attempt %d): %s",
                        ifelse(is.null(label), matrix, label),
                        attempt, e$message))
        return(NULL)
      }
    )

    if (!is.null(result)) {
      return(result)  # break loop if successful
    }

    attempt <- attempt + 1
    if (attempt > max_attempts) {
      stop("Max attempts reached without success.")
    }

    Sys.sleep(wait_seconds)  # backoff before retry
  }
}


# Get themes from data portal ####

data_portal_nav <- jsonlite::fromJSON(
  txt =
    paste0(
      "https://ws-data.nisra.gov.uk/public/api.jsonrpc",
      "?data=%7B%22jsonrpc%22:%222.0%22,%22method%22:%22",
      "PxStat.System.Navigation.Navigation_API.Read",
      "%22,%22params%22:%7B%22LngIsoCode%22:%22en%22%7D,%22id%22:1%7D"
    )
)

data_portal_structure <- data.frame(
  theme = character(),
  theme_code = numeric(),
  Subject = character(),
  subject_code = numeric(),
  product = character(),
  Product_code = character()
)

themes <- data_portal_nav$result$ThmValue
theme_codes <- data_portal_nav$result$ThmCode

for (i in seq_along(themes)) {

  subjects <- data_portal_nav$result$subject[[i]]$SbjValue
  subject_codes <- data_portal_nav$result$subject[[i]]$SbjCode

  for (j in seq_along(subjects)) {

    products <- data_portal_nav$result$subject[[i]]$product[[j]]$PrcValue
    product_codes <- data_portal_nav$result$subject[[i]]$product[[j]]$PrcCode

    for (k in seq_along(products)) {

      data_portal_structure <- data_portal_structure |>
        bind_rows(
          data.frame(
            theme = themes[i],
            theme_code = theme_codes[i],
            Subject = subjects[j],
            subject_code = subject_codes[j],
            product = products[k],
            Product_code = product_codes[k]
          )
        )

    }

  }
}

# Get list of tables from data portal ####

data_portal <- jsonlite::fromJSON(
  txt =
    paste0(
      "https://ws-data.nisra.gov.uk/public/api.restful/",
      "PxStat.Data.Cube_API.ReadCollection"
    )
)$link$item

associated_tables <- read.csv("public/data/associated-tables.csv")

tables <- list(table_count = nrow(data_portal),
               tables = list())

for (i in seq_along(data_portal$label)) {

  time_var <- unlist(data_portal$role$time[i])
  time_series <- data_portal$dimension[[time_var]]$category$index[[i]]

  matrix <- data_portal$extension$matrix[i]

  json_data <- fetch_dataset(matrix, api_key, data_portal$label[i])$result

  subject <- json_data$extension$subject$value
  product_code <- json_data$extension$product$code

  name <- gsub("\u2013", "-", data_portal$label[i], fixed = TRUE)
  if (name == "Life Expectancy at age 65") name <- "Life Expectancy at Age 65"
  if (name == "Births registered") name <- "Births Registered"

  theme <- data_portal_structure |>
    filter(Product_code == product_code)

  if (
    theme$theme %in% c(
      "Wellbeing framework", "Making life better", "Themed datasets"
    )
  ) next

  tables$tables[[matrix]] <- list(
    type = "dp",
    name = name,
    updated = as.Date(substr(data_portal$updated[i], 1, 10)),
    categories = json_data$dimension,
    statistics = json_data$dimension$STATISTIC$category$label,
    time = time_var,
    time_series = time_series,
    theme = theme$theme,
    theme_code = theme$theme_code,
    subject = subject,
    subject_code = theme$subject_code,
    product = json_data$extension$product$value,
    product_code = product_code,
    rows = length(json_data$value)
  )

  associated_product_code <- associated_tables %>%
    filter(MtrCode == matrix) %>%
    pull("prc_code")


  if (length(associated_product_code) > 0) {

    for (j in seq_along(associated_product_code)) {

      associated_theme <- data_portal_structure %>%
        filter(Product_code == associated_product_code[j])

      if (nrow(associated_theme) == 0) next
      if (
        associated_theme$theme %in% c(
          "Wellbeing framework", "Making life better", "Themed datasets"
        )
      ) next

      tables$tables[[paste0(matrix, "_", j)]] <- list(
        type = "dp",
        name = name,
        updated = as.Date(substr(data_portal$updated[i], 1, 10)),
        categories = json_data$dimension,
        statistics = json_data$dimension$STATISTIC$category$label,
        time = time_var,
        time_series = time_series,
        theme = associated_theme$theme,
        theme_code = associated_theme$theme_code,
        subject = associated_theme$Subject,
        subject_code = associated_theme$subject_code,
        product = associated_theme$product,
        product_code = associated_product_code[j],
        rows = length(json_data$value)
      )

    }

  }

}

census_tables <- list.files("public/data/census-tables", full.names = TRUE)
census_table_names <- read.csv("public/data/census-table-names.csv")

for (i in 1:length(census_tables)) {

  json_data <- read_json(census_tables[i])

  name <- census_table_names |>
    filter(path == census_tables[i]) |>
    pull(title)

  code <- census_table_names |>
    filter(path == census_tables[i]) |>
    pull("code")

  categories <- list()

  dimensions <- json_data$table$dimensions

  for (j in 1:length(dimensions)) {

    category <- dimensions[[j]]$categories

    index <- c()
    label <- list()

    for (k in 1:length(category)) {
      index[k] <- dimensions[[j]]$categories[[k]]$code
      label[[index[k]]] <- dimensions[[j]]$categories[[k]]$label
    }

    cat_name_raw <- dimensions[[j]]$variable$name

    cat_name <-
      if (j == 2) {
        "STATISTIC"
      } else if (cat_name_raw == "HEALTH_TRUST") {
        "HSCT"
      } else if (cat_name_raw == "PARLCON24") {
        "AA2024"
      } else {
        cat_name_raw
      }

    categories[[cat_name]] <- list(
      category = list(index = index,
                      label = label),
      label = dimensions[[j]]$variable$label
    )

  }

  categories[["TLIST(A1)"]] <- list(
    category = list(index = "2021",
                    label = list("2021" = "2021")),
    label = "Year"
  )

  tables$tables[[code]] <- list(
    type = "ftb",
    name = name,
    updated = "2023-05-31",
    categories = categories,
    statistics = categories$STATISTIC$category$label,
    time = "TLIST(A1)",
    time_series = c("2021"),
    theme = "People and communities",
    theme_code = 70,
    subject = "Census",
    subject_code = 148,
    product = "Census 2021",
    product_code = "C2021",
    rows = length(json_data$table$values),
    path = census_tables[i]
  )
}

tables$tables <- tables$tables[order(names(tables$tables))]

write_json(tables,
           "public/data/data-portal-tables.json",
           auto_unbox = TRUE,
           pretty = TRUE)
