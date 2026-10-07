package com.traceflow.intellitrace.util;

import java.io.*;
import java.util.ArrayList;
import java.util.List;

public class FileManager {

    public static ArrayList<String> readFile(String filePath) {
        ArrayList<String> lines = new ArrayList<>();
        if (filePath == null) {
            return lines;
        }
        File file = new File(filePath);
        if (!file.exists() || !file.isFile()) {
            System.out.println("[FileManager Error] File not found: " + filePath);
            return lines;
        }

        try (BufferedReader reader = new BufferedReader(new FileReader(file))) {
            String line;
            while ((line = reader.readLine()) != null) {
                lines.add(line);
            }
        } catch (IOException e) {
            System.out.println("[FileManager Error] Failed to read file " + filePath + ": " + e.getMessage());
        }
        return lines;
    }

    public static boolean writeFile(String filePath, List<String> lines) {
        if (filePath == null || lines == null) {
            return false;
        }
        File file = new File(filePath);
        File parent = file.getParentFile();
        if (parent != null && !parent.exists()) {
            parent.mkdirs();
        }

        try (BufferedWriter writer = new BufferedWriter(new FileWriter(file))) {
            for (String line : lines) {
                writer.write(line);
                writer.newLine();
            }
            return true;
        } catch (IOException e) {
            System.out.println("[FileManager Error] Failed to write file " + filePath + ": " + e.getMessage());
            return false;
        }
    }
}
