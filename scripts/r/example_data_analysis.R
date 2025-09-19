# Data Analysis Example
# Author: Oleksandr Koval
# Date: 2025

# Load required libraries
library(ggplot2)
library(dplyr)
library(readr)

# Set working directory and create sample data
set.seed(123)
sample_data <- data.frame(
  id = 1:100,
  group = sample(c("A", "B", "C"), 100, replace = TRUE),
  value1 = rnorm(100, mean = 50, sd = 15),
  value2 = rnorm(100, mean = 30, sd = 10),
  date = seq.Date(from = as.Date("2024-01-01"), 
                  length.out = 100, 
                  by = "day")
)

# Data exploration
print("Data Summary:")
summary(sample_data)

print("Group counts:")
table(sample_data$group)

# Data visualization
# 1. Histogram of value1
hist_plot <- ggplot(sample_data, aes(x = value1)) +
  geom_histogram(bins = 20, fill = "steelblue", alpha = 0.7) +
  labs(title = "Distribution of Value1",
       x = "Value1",
       y = "Frequency") +
  theme_minimal()

print(hist_plot)

# 2. Box plot by group
box_plot <- ggplot(sample_data, aes(x = group, y = value1, fill = group)) +
  geom_boxplot(alpha = 0.7) +
  labs(title = "Value1 Distribution by Group",
       x = "Group",
       y = "Value1") +
  theme_minimal() +
  scale_fill_brewer(palette = "Set2")

print(box_plot)

# 3. Scatter plot
scatter_plot <- ggplot(sample_data, aes(x = value1, y = value2, color = group)) +
  geom_point(alpha = 0.7, size = 2) +
  geom_smooth(method = "lm", se = FALSE) +
  labs(title = "Relationship between Value1 and Value2",
       x = "Value1",
       y = "Value2") +
  theme_minimal() +
  scale_color_brewer(palette = "Set1")

print(scatter_plot)

# Statistical analysis
# Correlation between value1 and value2
correlation <- cor(sample_data$value1, sample_data$value2)
print(paste("Correlation between Value1 and Value2:", round(correlation, 3)))

# Group means
group_means <- sample_data %>%
  group_by(group) %>%
  summarise(
    mean_value1 = mean(value1),
    mean_value2 = mean(value2),
    count = n()
  )

print("Group means:")
print(group_means)

# ANOVA test
anova_result <- aov(value1 ~ group, data = sample_data)
print("ANOVA Results:")
print(summary(anova_result))

# Save results (optional)
# write_csv(sample_data, "analysis_data.csv")
# ggsave("histogram.png", hist_plot, width = 8, height = 6)
# ggsave("boxplot.png", box_plot, width = 8, height = 6)
# ggsave("scatterplot.png", scatter_plot, width = 8, height = 6)

print("Analysis completed successfully!")