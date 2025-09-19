/**
 * Basic C++ Program Template
 * Author: Oleksandr Koval (@oleksandkov)
 * Date: YYYY-MM-DD
 * Description: Template for C++ programs
 */

#include <iostream>
#include <vector>
#include <string>
#include <algorithm>

using namespace std;

/**
 * Function template - replace with your actual functions
 * @param parameter Description of parameter
 * @return Description of return value
 */
int exampleFunction(int parameter) {
    // Your implementation here
    return parameter * 2;
}

/**
 * Main function
 */
int main() {
    cout << "Program started..." << endl;
    
    // Your main program logic here
    
    // Example usage
    int result = exampleFunction(5);
    cout << "Result: " << result << endl;
    
    cout << "Program completed successfully." << endl;
    
    return 0;
}

/**
 * Compilation instructions:
 * g++ -o program basic-program-template.cpp
 * 
 * Run with:
 * ./program
 */