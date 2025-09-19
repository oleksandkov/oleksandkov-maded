# Data Visualization Examples
# Author: Oleksandr Koval (@oleksandkov)
# Purpose: Demonstrate various data visualization techniques in R

library(ggplot2)
library(dplyr)
library(gridExtra)

# Create sample data
set.seed(123)
sample_data <- data.frame(
  category = rep(c("A", "B", "C", "D"), each = 25),
  value1 = c(rnorm(25, 10, 2), rnorm(25, 15, 3), rnorm(25, 12, 2.5), rnorm(25, 8, 1.5)),
  value2 = c(rnorm(25, 20, 4), rnorm(25, 25, 5), rnorm(25, 18, 3), rnorm(25, 22, 4)),
  date = rep(seq.Date(from = as.Date("2024-01-01"), length.out = 25, by = "day"), 4)
)

# 1. Basic scatter plot
plot1 <- ggplot(sample_data, aes(x = value1, y = value2, color = category)) +
  geom_point(size = 3, alpha = 0.7) +
  theme_minimal() +
  labs(title = "Scatter Plot Example",
       x = "Value 1", 
       y = "Value 2",
       color = "Category") +
  theme(legend.position = "bottom")

# 2. Box plot comparison
plot2 <- ggplot(sample_data, aes(x = category, y = value1, fill = category)) +
  geom_boxplot(alpha = 0.7) +
  theme_minimal() +
  labs(title = "Box Plot Comparison",
       x = "Category",
       y = "Value 1") +
  theme(legend.position = "none")

# 3. Time series visualization
plot3 <- sample_data %>%
  filter(category == "A") %>%
  ggplot(aes(x = date, y = value1)) +
  geom_line(color = "blue", size = 1) +
  geom_point(color = "red", size = 2) +
  theme_minimal() +
  labs(title = "Time Series Example",
       x = "Date",
       y = "Value 1")

# 4. Histogram with density curve
plot4 <- ggplot(sample_data, aes(x = value1)) +
  geom_histogram(aes(y = ..density..), bins = 30, fill = "lightblue", alpha = 0.7) +
  geom_density(color = "red", size = 1) +
  theme_minimal() +
  labs(title = "Histogram with Density",
       x = "Value 1",
       y = "Density")

# Display plots
print(plot1)
print(plot2)
print(plot3)
print(plot4)

# Save combined plot
combined_plot <- grid.arrange(plot1, plot2, plot3, plot4, ncol = 2)

# Save to graphs directory
ggsave("../../../graphs/r-visualization-examples.png", combined_plot, 
       width = 12, height = 10, dpi = 300)

cat("Visualization examples completed!\nGraphs saved to graphs/r-visualization-examples.png\n")