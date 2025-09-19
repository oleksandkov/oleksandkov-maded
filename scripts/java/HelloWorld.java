/**
 * Hello World Java Application
 * Author: Oleksandr Koval (@oleksandkov)
 * Purpose: Demonstrate basic Java programming concepts
 */

import java.util.*;
import java.text.SimpleDateFormat;

public class HelloWorld {
    
    // Class variables
    private static final String AUTHOR = "Oleksandr Koval (@oleksandkov)";
    private static final String VERSION = "1.0";
    
    /**
     * Demonstrate basic Java features
     */
    public static void demonstrateBasics() {
        System.out.println("\n=== Basic Java Demonstration ===");
        
        // Variables and data types
        int number = 42;
        double pi = 3.14159;
        String greeting = "Hello, Java World!";
        boolean isDemo = true;
        
        System.out.println("Integer: " + number);
        System.out.println("Double: " + pi);
        System.out.println("String: " + greeting);
        System.out.println("Boolean: " + isDemo);
        
        // Current date
        SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");
        System.out.println("Current time: " + sdf.format(new Date()));
    }
    
    /**
     * Demonstrate collections
     */
    public static void demonstrateCollections() {
        System.out.println("\n=== Collections Demo ===");
        
        // ArrayList example
        ArrayList<String> languages = new ArrayList<>();
        languages.add("Java");
        languages.add("Python");
        languages.add("C++");
        languages.add("R");
        
        System.out.println("Programming languages:");
        for(String lang : languages) {
            System.out.println("- " + lang);
        }
        
        // HashMap example
        HashMap<String, Integer> scores = new HashMap<>();
        scores.put("Alice", 95);
        scores.put("Bob", 87);
        scores.put("Charlie", 92);
        
        System.out.println("\nScores:");
        for(Map.Entry<String, Integer> entry : scores.entrySet()) {
            System.out.println(entry.getKey() + ": " + entry.getValue());
        }
    }
    
    /**
     * Demonstrate user input
     */
    public static void demonstrateInput() {
        System.out.println("\n=== User Input Demo ===");
        
        Scanner scanner = new Scanner(System.in);
        System.out.print("Enter your name: ");
        String name = scanner.nextLine();
        
        System.out.println("Hello, " + name + "! Welcome to Java programming.");
        
        scanner.close();
    }
    
    /**
     * Main method
     */
    public static void main(String[] args) {
        System.out.println("Java Demonstration Program");
        System.out.println("=========================");
        System.out.println("Author: " + AUTHOR);
        System.out.println("Version: " + VERSION);
        
        demonstrateBasics();
        demonstrateCollections();
        demonstrateInput();
        
        System.out.println("\nProgram completed successfully!");
    }
}

/**
 * Compilation and execution:
 * javac HelloWorld.java
 * java HelloWorld
 */