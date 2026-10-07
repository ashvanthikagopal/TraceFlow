package com.traceflow.intellitrace.menu;

import com.traceflow.intellitrace.model.Program;
import com.traceflow.intellitrace.model.User;
import com.traceflow.intellitrace.service.AuthService;
import com.traceflow.intellitrace.service.ExecutionEngine;
import com.traceflow.intellitrace.service.VisualizationService;
import com.traceflow.intellitrace.util.FileManager;
import com.traceflow.intellitrace.util.Validation;

import java.io.File;
import java.util.ArrayList;
import java.util.Scanner;

public class Menu {

    private final Scanner scanner;
    private final AuthService authService;
    private final ExecutionEngine executionEngine;
    private final VisualizationService visualizationService;

    private User currentUser;
    private boolean authenticated;
    private Program currentProgram;

    public Menu() {
        this.scanner = new Scanner(System.in);
        this.authService = new AuthService();
        this.executionEngine = new ExecutionEngine();
        this.visualizationService = new VisualizationService();
        this.authenticated = false;
        this.currentUser = null;
        this.currentProgram = null;
    }

    public void start() {
        printBanner("WELCOME TO INTELLITRACE");
        System.out.println("Intelligent Offline Java Source Analysis & Execution Timeline Studio");
        System.out.println("=========================================================================================");

        // Step 1: Authentication Loop Gate
        while (!authenticated) {
            System.out.println("\n--- AUTHENTICATION MENU ---");
            System.out.println("1. Login");
            System.out.println("2. Register New User");
            System.out.println("3. Exit");
            System.out.print("Select an option (1-3): ");

            String choice = scanner.nextLine().trim();
            switch (choice) {
                case "1":
                    loginUser();
                    break;
                case "2":
                    registerUser();
                    break;
                case "3":
                    System.out.println("\nExiting IntelliTrace. Goodbye!");
                    return;
                default:
                    System.out.println("[Error] Invalid choice. Please enter 1, 2, or 3.");
            }
        }

        // Step 2: Main Application Menu Loop
        boolean running = true;
        while (running) {
            printMainMenu();
            System.out.print("Select an option (1-9): ");
            String choice = scanner.nextLine().trim();

            switch (choice) {
                case "1":
                    loadJavaFile();
                    break;
                case "2":
                    viewSourceCode();
                    break;
                case "3":
                    executeProgram();
                    break;
                case "4":
                    viewVariableTable();
                    break;
                case "5":
                    viewExecutionTimeline();
                    break;
                case "6":
                    saveExecutionLog();
                    break;
                case "7":
                    registerUser();
                    break;
                case "8":
                    loginUser();
                    break;
                case "9":
                    System.out.println("\n=========================================================================================");
                    System.out.println("                      THANK YOU FOR USING INTELLITRACE!                                  ");
                    System.out.println("=========================================================================================");
                    running = false;
                    break;
                default:
                    System.out.println("[Error] Invalid option. Please choose between 1 and 9.");
            }
        }
    }

    private void printMainMenu() {
        System.out.println("\n=========================================================================================");
        System.out.println("                                  INTELLITRACE MAIN MENU                                 ");
        System.out.println("=========================================================================================");
        System.out.printf("Active Session: %s (%s) | Loaded File: %s%n",
                currentUser != null ? currentUser.getName() : "Anonymous",
                currentUser != null ? currentUser.getEmail() : "N/A",
                currentProgram != null ? currentProgram.getFileName() : "None");
        System.out.println("-----------------------------------------------------------------------------------------");
        System.out.println("1. Load Java File");
        System.out.println("2. View Source Code");
        System.out.println("3. Execute Program (Static Analysis & Expression Evaluation)");
        System.out.println("4. View Variable Table");
        System.out.println("5. View Execution Timeline");
        System.out.println("6. Save Execution Log (Export to CSV / File)");
        System.out.println("7. Register New Account");
        System.out.println("8. Switch / Login User");
        System.out.println("9. Exit");
        System.out.println("=========================================================================================");
    }

    private void loadJavaFile() {
        printBanner("LOAD JAVA FILE");
        System.out.print("Enter absolute or relative path to .java file (or press ENTER for 'data/Sample.java'): ");
        String path = scanner.nextLine().trim();
        if (path.isEmpty()) {
            path = "data/Sample.java";
        }

        if (!Validation.isValidJavaFile(path)) {
            return;
        }

        ArrayList<String> lines = FileManager.readFile(path);
        if (lines.isEmpty()) {
            System.out.println("[Error] Could not load content from: " + path);
            return;
        }

        File file = new File(path);
        currentProgram = new Program(file.getName(), lines);
        System.out.printf("[Success] File '%s' loaded successfully (%d lines read).%n", file.getName(), lines.size());
    }

    private void viewSourceCode() {
        if (guardNoProgram()) return;

        printBanner("SOURCE CODE: " + currentProgram.getFileName());
        ArrayList<String> lines = currentProgram.getSourceCode();
        for (int i = 0; i < lines.size(); i++) {
            System.out.printf("%4d | %s%n", (i + 1), lines.get(i));
        }
        System.out.println("-----------------------------------------------------------------------------------------");
        System.out.printf("Total Lines: %d%n", lines.size());
        System.out.println("=========================================================================================");
    }

    private void executeProgram() {
        if (guardNoProgram()) return;
        executionEngine.execute(currentProgram);
    }

    private void viewVariableTable() {
        if (guardNoProgram()) return;
        if (currentProgram.getVariables().isEmpty()) {
            System.out.println("[Info] Parsing variables now...");
            executionEngine.execute(currentProgram);
        }
        visualizationService.printVariableTable(currentProgram);
    }

    private void viewExecutionTimeline() {
        if (guardNoProgram()) return;
        if (currentProgram.getExecutionLog().getSteps().isEmpty()) {
            System.out.println("[Info] Generating timeline now...");
            executionEngine.execute(currentProgram);
        }
        visualizationService.printTimeline(currentProgram);
    }

    private void saveExecutionLog() {
        if (guardNoProgram()) return;

        if (currentProgram.getExecutionLog().getSteps().isEmpty()) {
            System.out.println("[Info] Program not executed yet. Executing now to generate log...");
            executionEngine.execute(currentProgram);
        }

        printBanner("SAVE EXECUTION LOG");
        System.out.println("1. Save as CSV Spreadsheet (.csv)");
        System.out.println("2. Save as Formatted Text Log (.txt)");
        System.out.print("Select export format (1 or 2): ");
        String fmtChoice = scanner.nextLine().trim();

        System.out.print("Enter target file path (press ENTER for default in 'data/'): ");
        String targetPath = scanner.nextLine().trim();

        if (targetPath.isEmpty()) {
            String baseName = currentProgram.getFileName().replace(".java", "");
            if ("2".equals(fmtChoice)) {
                targetPath = "data/" + baseName + "_execution_log.txt";
            } else {
                targetPath = "data/" + baseName + "_execution_log.csv";
            }
        }

        File targetFile = new File(targetPath);
        boolean success;
        if ("2".equals(fmtChoice)) {
            success = currentProgram.getExecutionLog().saveToFile(targetFile);
        } else {
            success = currentProgram.getExecutionLog().saveToCsv(targetFile);
        }

        if (success) {
            System.out.printf("[Success] Execution log exported successfully to: %s (%d steps written)%n",
                    targetFile.getAbsolutePath(), currentProgram.getExecutionLog().size());
        } else {
            System.out.println("[Error] Failed to save execution log.");
        }
    }

    private void registerUser() {
        printBanner("REGISTER NEW USER");
        System.out.print("Enter Full Name (e.g. Alice Smith): ");
        String name = scanner.nextLine().trim();

        System.out.print("Enter Email Address (e.g. alice@example.com): ");
        String email = scanner.nextLine().trim();

        System.out.print("Enter 10-digit Mobile Number (e.g. 9876543210): ");
        String mobileNo = scanner.nextLine().trim();

        System.out.print("Enter Password (min 6 characters): ");
        String password = scanner.nextLine().trim();

        boolean registered = authService.register(name, email, mobileNo, password);
        if (registered) {
            System.out.println("[Success] Account created! You can now log in.");
        } else {
            System.out.println("[Failed] Registration could not be completed. Please correct errors and try again.");
        }
    }

    private void loginUser() {
        printBanner("USER LOGIN");
        System.out.print("Enter Registered Email: ");
        String email = scanner.nextLine().trim();

        System.out.print("Enter Password: ");
        String password = scanner.nextLine().trim();

        User user = authService.login(email, password);
        if (user != null) {
            this.currentUser = user;
            this.authenticated = true;
            System.out.printf("[Success] Welcome back, %s! Session authenticated.%n", user.getName());
        } else {
            System.out.println("[Failed] Authentication failed. Invalid email or password.");
        }
    }

    private boolean guardNoProgram() {
        if (currentProgram == null) {
            System.out.println("[Warning] No Java program is loaded. Please choose Option 1 to load a file first.");
            return true;
        }
        return false;
    }

    private void printBanner(String title) {
        System.out.println("\n=========================================================================================");
        System.out.printf(" %-86s %n", title);
        System.out.println("=========================================================================================");
    }
}
