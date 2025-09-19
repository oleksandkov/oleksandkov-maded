/**
 * Example Java Program - Data Processing and Analysis
 * Author: Oleksandr Koval
 * Date: 2025
 * 
 * This program demonstrates basic Java concepts including:
 * - Object-oriented programming
 * - Collections framework
 * - File I/O
 * - Exception handling
 * - Lambda expressions and streams
 */

import java.io.*;
import java.util.*;
import java.util.stream.Collectors;

// Data class to represent a person
class Person {
    private String name;
    private int age;
    private String department;
    private double salary;
    
    public Person(String name, int age, String department, double salary) {
        this.name = name;
        this.age = age;
        this.department = department;
        this.salary = salary;
    }
    
    // Getters
    public String getName() { return name; }
    public int getAge() { return age; }
    public String getDepartment() { return department; }
    public double getSalary() { return salary; }
    
    @Override
    public String toString() {
        return String.format("Person{name='%s', age=%d, department='%s', salary=%.2f}", 
                           name, age, department, salary);
    }
}

// Main class
public class DataProcessor {
    private List<Person> people;
    
    public DataProcessor() {
        this.people = new ArrayList<>();
        initializeSampleData();
    }
    
    private void initializeSampleData() {
        people.add(new Person("Alice Johnson", 28, "Engineering", 75000.0));
        people.add(new Person("Bob Smith", 32, "Marketing", 65000.0));
        people.add(new Person("Carol Williams", 25, "Engineering", 70000.0));
        people.add(new Person("David Brown", 35, "Sales", 60000.0));
        people.add(new Person("Eva Davis", 29, "Engineering", 80000.0));
        people.add(new Person("Frank Miller", 31, "Marketing", 67000.0));
        people.add(new Person("Grace Wilson", 27, "Sales", 58000.0));
    }
    
    public void displayAllPeople() {
        System.out.println("\n=== All People ===");
        people.forEach(System.out::println);
    }
    
    public void analyzeByDepartment() {
        System.out.println("\n=== Analysis by Department ===");
        
        Map<String, List<Person>> groupedByDepartment = people.stream()
            .collect(Collectors.groupingBy(Person::getDepartment));
        
        groupedByDepartment.forEach((department, peopleInDept) -> {
            double avgSalary = peopleInDept.stream()
                .mapToDouble(Person::getSalary)
                .average()
                .orElse(0.0);
            
            double avgAge = peopleInDept.stream()
                .mapToInt(Person::getAge)
                .average()
                .orElse(0.0);
            
            System.out.printf("Department: %s%n", department);
            System.out.printf("  Count: %d%n", peopleInDept.size());
            System.out.printf("  Average Salary: $%.2f%n", avgSalary);
            System.out.printf("  Average Age: %.1f%n", avgAge);
            System.out.println();
        });
    }
    
    public void findTopEarners(int count) {
        System.out.println("\n=== Top " + count + " Earners ===");
        
        List<Person> topEarners = people.stream()
            .sorted((p1, p2) -> Double.compare(p2.getSalary(), p1.getSalary()))
            .limit(count)
            .collect(Collectors.toList());
        
        topEarners.forEach(System.out::println);
    }
    
    public void filterByAge(int minAge, int maxAge) {
        System.out.println("\n=== People aged " + minAge + "-" + maxAge + " ===");
        
        List<Person> filtered = people.stream()
            .filter(p -> p.getAge() >= minAge && p.getAge() <= maxAge)
            .collect(Collectors.toList());
        
        filtered.forEach(System.out::println);
    }
    
    public void saveToFile(String filename) {
        try (PrintWriter writer = new PrintWriter(new FileWriter(filename))) {
            writer.println("Name,Age,Department,Salary");
            
            for (Person person : people) {
                writer.printf("%s,%d,%s,%.2f%n",
                    person.getName(),
                    person.getAge(),
                    person.getDepartment(),
                    person.getSalary());
            }
            
            System.out.println("\nData saved to " + filename);
            
        } catch (IOException e) {
            System.err.println("Error writing to file: " + e.getMessage());
        }
    }
    
    public void calculateStatistics() {
        System.out.println("\n=== Overall Statistics ===");
        
        DoubleSummaryStatistics salaryStats = people.stream()
            .mapToDouble(Person::getSalary)
            .summaryStatistics();
        
        IntSummaryStatistics ageStats = people.stream()
            .mapToInt(Person::getAge)
            .summaryStatistics();
        
        System.out.printf("Total People: %d%n", people.size());
        System.out.println("\nSalary Statistics:");
        System.out.printf("  Average: $%.2f%n", salaryStats.getAverage());
        System.out.printf("  Minimum: $%.2f%n", salaryStats.getMin());
        System.out.printf("  Maximum: $%.2f%n", salaryStats.getMax());
        System.out.printf("  Total: $%.2f%n", salaryStats.getSum());
        
        System.out.println("\nAge Statistics:");
        System.out.printf("  Average: %.1f%n", ageStats.getAverage());
        System.out.printf("  Minimum: %d%n", ageStats.getMin());
        System.out.printf("  Maximum: %d%n", ageStats.getMax());
    }
    
    public static void main(String[] args) {
        System.out.println("Java Data Processing Example");
        System.out.println("============================");
        
        DataProcessor processor = new DataProcessor();
        
        // Display all data
        processor.displayAllPeople();
        
        // Perform various analyses
        processor.analyzeByDepartment();
        processor.findTopEarners(3);
        processor.filterByAge(25, 30);
        processor.calculateStatistics();
        
        // Save data to file
        processor.saveToFile("people_data.csv");
        
        System.out.println("\nProgram completed successfully!");
    }
}