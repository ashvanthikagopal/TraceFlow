package com.traceflow.intellitrace;

import com.traceflow.intellitrace.util.Validation;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

public class ValidationTest {

    @Test
    public void testValidEmail() {
        assertTrue(Validation.isValidEmail("john.doe@example.com"));
        assertTrue(Validation.isValidEmail("alice+tag@university.edu"));
        assertFalse(Validation.isValidEmail("invalid-email"));
        assertFalse(Validation.isValidEmail("user@.com"));
        assertFalse(Validation.isValidEmail(""));
        assertFalse(Validation.isValidEmail(null));
    }

    @Test
    public void testValidMobileNumber() {
        assertTrue(Validation.isValidMobileNumber("9876543210"));
        assertTrue(Validation.isValidMobileNumber("1234567890"));
        assertFalse(Validation.isValidMobileNumber("12345")); // too short
        assertFalse(Validation.isValidMobileNumber("12345678901")); // too long
        assertFalse(Validation.isValidMobileNumber("987654321a")); // contains letters
        assertFalse(Validation.isValidMobileNumber(""));
        assertFalse(Validation.isValidMobileNumber(null));
    }

    @Test
    public void testValidPassword() {
        assertTrue(Validation.isValidPassword("secret123"));
        assertTrue(Validation.isValidPassword("P@ssw0rd"));
        assertFalse(Validation.isValidPassword("12345")); // < 6 chars
        assertFalse(Validation.isValidPassword(""));
        assertFalse(Validation.isValidPassword(null));
    }

    @Test
    public void testValidName() {
        assertTrue(Validation.isValidName("Alice Smith"));
        assertTrue(Validation.isValidName("Bob"));
        assertFalse(Validation.isValidName("A")); // < 2 chars
        assertFalse(Validation.isValidName("John123")); // contains digits
        assertFalse(Validation.isValidName(""));
        assertFalse(Validation.isValidName(null));
    }

    @Test
    public void testValidJavaFile() {
        assertTrue(Validation.isValidJavaFile("data/Sample.java"));
        assertFalse(Validation.isValidJavaFile("data/Sample.txt"));
        assertFalse(Validation.isValidJavaFile("non_existent_file.java"));
        assertFalse(Validation.isValidJavaFile(""));
        assertFalse(Validation.isValidJavaFile(null));
    }
}
