/**
 * Example C++ Program - Basic Algorithms and Data Structures
 * Author: Oleksandr Koval
 * Date: 2025
 * 
 * This file demonstrates basic C++ programming concepts including:
 * - Functions and classes
 * - STL containers and algorithms
 * - File I/O
 * - Basic data structures
 */

#include <iostream>
#include <vector>
#include <algorithm>
#include <string>
#include <fstream>
#include <map>

// Simple class example
class Calculator {
private:
    double result;

public:
    Calculator() : result(0.0) {}
    
    void add(double value) {
        result += value;
    }
    
    void subtract(double value) {
        result -= value;
    }
    
    void multiply(double value) {
        result *= value;
    }
    
    void divide(double value) {
        if (value != 0) {
            result /= value;
        } else {
            std::cout << "Error: Division by zero!" << std::endl;
        }
    }
    
    double getResult() const {
        return result;
    }
    
    void reset() {
        result = 0.0;
    }
};

// Function to demonstrate STL algorithms
void demonstrateSTL() {
    std::cout << "\n=== STL Demonstration ===" << std::endl;
    
    // Vector operations
    std::vector<int> numbers = {5, 2, 8, 1, 9, 3};
    
    std::cout << "Original vector: ";
    for (int num : numbers) {
        std::cout << num << " ";
    }
    std::cout << std::endl;
    
    // Sort the vector
    std::sort(numbers.begin(), numbers.end());
    
    std::cout << "Sorted vector: ";
    for (int num : numbers) {
        std::cout << num << " ";
    }
    std::cout << std::endl;
    
    // Find maximum and minimum
    auto max_it = std::max_element(numbers.begin(), numbers.end());
    auto min_it = std::min_element(numbers.begin(), numbers.end());
    
    std::cout << "Maximum: " << *max_it << std::endl;
    std::cout << "Minimum: " << *min_it << std::endl;
    
    // Count occurrences
    int count_3 = std::count(numbers.begin(), numbers.end(), 3);
    std::cout << "Count of 3: " << count_3 << std::endl;
}

// Function to demonstrate basic file I/O
void fileIOExample() {
    std::cout << "\n=== File I/O Example ===" << std::endl;
    
    // Write to file
    std::ofstream outFile("example_output.txt");
    if (outFile.is_open()) {
        outFile << "Hello from C++!" << std::endl;
        outFile << "This is a sample file." << std::endl;
        outFile << "Numbers: ";
        for (int i = 1; i <= 5; ++i) {
            outFile << i << " ";
        }
        outFile << std::endl;
        outFile.close();
        std::cout << "Data written to file successfully." << std::endl;
    } else {
        std::cout << "Unable to open file for writing." << std::endl;
    }
    
    // Read from file
    std::ifstream inFile("example_output.txt");
    if (inFile.is_open()) {
        std::string line;
        std::cout << "File contents:" << std::endl;
        while (std::getline(inFile, line)) {
            std::cout << line << std::endl;
        }
        inFile.close();
    } else {
        std::cout << "Unable to open file for reading." << std::endl;
    }
}

// Function to demonstrate map usage
void mapExample() {
    std::cout << "\n=== Map Example ===" << std::endl;
    
    std::map<std::string, int> wordCount;
    
    // Add some words
    wordCount["hello"] = 3;
    wordCount["world"] = 2;
    wordCount["cpp"] = 5;
    wordCount["programming"] = 1;
    
    std::cout << "Word frequencies:" << std::endl;
    for (const auto& pair : wordCount) {
        std::cout << pair.first << ": " << pair.second << std::endl;
    }
}

int main() {
    std::cout << "C++ Example Program" << std::endl;
    std::cout << "===================" << std::endl;
    
    // Calculator example
    std::cout << "\n=== Calculator Example ===" << std::endl;
    Calculator calc;
    
    calc.add(10);
    std::cout << "After adding 10: " << calc.getResult() << std::endl;
    
    calc.multiply(3);
    std::cout << "After multiplying by 3: " << calc.getResult() << std::endl;
    
    calc.subtract(5);
    std::cout << "After subtracting 5: " << calc.getResult() << std::endl;
    
    calc.divide(5);
    std::cout << "After dividing by 5: " << calc.getResult() << std::endl;
    
    // Demonstrate other features
    demonstrateSTL();
    fileIOExample();
    mapExample();
    
    std::cout << "\nProgram completed successfully!" << std::endl;
    
    return 0;
}