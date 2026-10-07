package com.traceflow.intellitrace.service;

import com.traceflow.intellitrace.model.User;

import java.util.List;

public class DbViewer {

    public static void main(String[] args) {
        System.out.println("=========================================================================================");
        System.out.println("                         INTELLITRACE DATABASE VIEWER                                    ");
        System.out.println("=========================================================================================");

        AuthService authService = new AuthService();
        List<User> users = authService.getAllUsers();

        if (users.isEmpty()) {
            System.out.println("[DbViewer] No users registered in database table 'users'.");
        } else {
            System.out.println("+------+----------------------+---------------------------+-------------+----------------------+");
            System.out.printf("| %-4s | %-20s | %-25s | %-11s | %-20s |%n", "ID", "Name", "Email", "Mobile No", "Password Hash");
            System.out.println("+------+----------------------+---------------------------+-------------+----------------------+");

            for (User u : users) {
                String shortHash = u.getPassword() != null && u.getPassword().length() > 20
                        ? u.getPassword().substring(0, 17) + "..."
                        : (u.getPassword() != null ? u.getPassword() : "null");

                System.out.printf("| %-4d | %-20s | %-25s | %-11s | %-20s |%n",
                        u.getId(),
                        u.getName() != null ? u.getName() : "",
                        u.getEmail() != null ? u.getEmail() : "",
                        u.getMobileNo() != null ? u.getMobileNo() : "",
                        shortHash);
            }
            System.out.println("+------+----------------------+---------------------------+-------------+----------------------+");
            System.out.printf("Total registered users: %d%n", users.size());
        }

        System.out.println("=========================================================================================");
    }
}
