# Data Analysis Template
# Author: Oleksandr Koval (@oleksandkov)
# Date: YYYY-MM-DD
# Description: Template for data analysis projects

# Load required libraries
library(tidyverse)
library(ggplot2)
library(dplyr)

# Set working directory and options
setwd("path/to/your/project")
options(stringsAsFactors = FALSE)

# ============================================================================
# 1. DATA LOADING AND EXPLORATION
# ============================================================================

# Load data
data <- read.csv("your-data-file.csv")

# Basic data exploration
glimpse(data)
summary(data)
head(data)

# Check for missing values
sum(is.na(data))
colSums(is.na(data))

# ============================================================================
# 2. DATA CLEANING AND PREPROCESSING
# ============================================================================

# Remove duplicates
data <- data %>% distinct()

# Handle missing values
# data <- data %>% drop_na()  # or
# data <- data %>% fill(column_name)

# Data type conversions
# data$date_column <- as.Date(data$date_column)
# data$factor_column <- as.factor(data$factor_column)

# ============================================================================
# 3. EXPLORATORY DATA ANALYSIS
# ============================================================================

# Descriptive statistics
summary(data)

# Basic visualizations
ggplot(data, aes(x = variable1, y = variable2)) +
  geom_point() +
  theme_minimal() +
  labs(title = "Your Plot Title",
       x = "X-axis Label",
       y = "Y-axis Label")

# ============================================================================
# 4. ANALYSIS
# ============================================================================

# Your analysis code here
# Statistical tests, models, etc.

# ============================================================================
# 5. RESULTS AND VISUALIZATION
# ============================================================================

# Create final plots and save results

# ============================================================================
# 6. EXPORT RESULTS
# ============================================================================

# Save cleaned data
# write.csv(data, "cleaned_data.csv", row.names = FALSE)

# Save plots
# ggsave("plot.png", width = 10, height = 6, dpi = 300)