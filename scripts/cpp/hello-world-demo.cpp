/**
 * Hello World Demonstration
 * Author: Oleksandr Koval (@oleksandkov)
 * Purpose: Simple C++ program demonstrating basic features
 */

#include <iostream>
#include <vector>
#include <string>
#include <algorithm>

using namespace std;

// Function to demonstrate basic operations
void demonstrateBasics() {
    cout << "\n=== Basic C++ Demonstration ===" << endl;
    
    // Variables and data types
    int number = 42;
    double pi = 3.14159;
    string greeting = "Hello, World!";
    bool isDemo = true;
    
    cout << "Integer: " << number << endl;
    cout << "Double: " << pi << endl;
    cout << "String: " << greeting << endl;
    cout << "Boolean: " << (isDemo ? "true" : "false") << endl;
}

// Function to demonstrate vectors
void demonstrateVectors() {
    cout << "\n=== Vector Operations ===" << endl;
    
    vector<int> numbers = {5, 2, 8, 1, 9, 3};
    
    cout << "Original vector: ";
    for(int num : numbers) {
        cout << num << " ";
    }
    cout << endl;
    
    // Sort the vector
    sort(numbers.begin(), numbers.end());
    
    cout << "Sorted vector: ";
    for(int num : numbers) {
        cout << num << " ";
    }
    cout << endl;
    
    // Find maximum and minimum
    auto max_element_iter = max_element(numbers.begin(), numbers.end());
    auto min_element_iter = min_element(numbers.begin(), numbers.end());
    
    cout << "Maximum: " << *max_element_iter << endl;
    cout << "Minimum: " << *min_element_iter << endl;
}

// Function to demonstrate user input
void demonstrateInput() {
    cout << "\n=== User Input Demo ===" << endl;
    
    string name;
    cout << "Enter your name: ";
    getline(cin, name);
    
    cout << "Hello, " << name << "! Welcome to C++ programming." << endl;
}

int main() {
    cout << "C++ Demonstration Program" << endl;
    cout << "=========================" << endl;
    
    demonstrateBasics();
    demonstrateVectors();
    demonstrateInput();
    
    cout << "\nProgram completed successfully!" << endl;
    
    return 0;
}

/**
 * Compilation and execution:
 * g++ -o hello-world-demo hello-world-demo.cpp
 * ./hello-world-demo
 */