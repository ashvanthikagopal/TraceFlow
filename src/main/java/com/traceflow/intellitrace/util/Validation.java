package com.traceflow.intellitrace.util;

import java.io.File;
import java.util.regex.Pattern;

public class Validation {

    private static final Pattern EMAIL_PATTERN = Pattern.compile("^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$");
    private static final Pattern MOBILE_PATTERN = Pattern.compile("^[0-9]{10}$");
    private static final Pattern NAME_PATTERN = Pattern.compile("^[A-Za-z ]{2,50}$");

    public static boolean isValidJavaFile(String filePath) {
        if (filePath == null || filePath.trim().isEmpty()) {
            System.out.println("[Validation Error] File path cannot be null or empty.");
            return false;
        }
        if (!filePath.trim().endsWith(".java")) {
            System.out.println("[Validation Error] File must have a .java extension: " + filePath);
            return false;
        }
        File file = new File(filePath.trim());
        if (!file.exists()) {
            System.out.println("[Validation Error] File does not exist on disk: " + filePath);
            return false;
        }
        if (!file.isFile()) {
            System.out.println("[Validation Error] Path is not a regular file: " + filePath);
            return false;
        }
        if (file.length() == 0) {
            System.out.println("[Validation Error] File is empty (0 bytes): " + filePath);
            return false;
        }
        return true;
    }

    public static boolean isValidEmail(String email) {
        if (email == null || email.trim().isEmpty()) {
            System.out.println("[Validation Error] Email address cannot be blank.");
            return false;
        }
        if (!EMAIL_PATTERN.matcher(email.trim()).matches()) {
            System.out.println("[Validation Error] Invalid email format: '" + email + "'. Expected format: user@example.com");
            return false;
        }
        return true;
    }

    public static boolean isValidPassword(String password) {
        if (password == null || password.trim().isEmpty()) {
            System.out.println("[Validation Error] Password cannot be blank.");
            return false;
        }
        if (password.length() < 6) {
            System.out.println("[Validation Error] Password must be at least 6 characters long (got " + password.length() + ").");
            return false;
        }
        return true;
    }

    public static boolean isValidName(String name) {
        if (name == null || name.trim().isEmpty()) {
            System.out.println("[Validation Error] Name cannot be blank.");
            return false;
        }
        if (!NAME_PATTERN.matcher(name.trim()).matches()) {
            System.out.println("[Validation Error] Name must contain only letters and spaces, between 2 and 50 characters: '" + name + "'");
            return false;
        }
        return true;
    }

    public static boolean isValidMobileNumber(String mobileNo) {
        if (mobileNo == null || mobileNo.trim().isEmpty()) {
            System.out.println("[Validation Error] Mobile number cannot be blank.");
            return false;
        }
        if (!MOBILE_PATTERN.matcher(mobileNo.trim()).matches()) {
            System.out.println("[Validation Error] Mobile number must be exactly 10 digits: '" + mobileNo + "'");
            return false;
        }
        return true;
    }
}
