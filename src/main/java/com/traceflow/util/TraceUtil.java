package com.traceflow.util;

import com.sun.jdi.*;

public class TraceUtil {

    public static String formatJdiValue(Value value) {
        if (value == null) {
            return "null";
        }
        if (value instanceof PrimitiveValue) {
            return value.toString();
        }
        if (value instanceof StringReference) {
            String str = ((StringReference) value).value();
            if (str.length() > 100) {
                return "\"" + str.substring(0, 97) + "...\"";
            }
            return "\"" + str + "\"";
        }
        if (value instanceof ArrayReference) {
            ArrayReference arr = (ArrayReference) value;
            int length = arr.length();
            StringBuilder sb = new StringBuilder("[");
            int maxItems = Math.min(length, 10);
            for (int i = 0; i < maxItems; i++) {
                if (i > 0) sb.append(", ");
                try {
                    Value item = arr.getValue(i);
                    sb.append(formatJdiValue(item));
                } catch (Exception e) {
                    sb.append("?");
                }
            }
            if (length > maxItems) {
                sb.append(", ... +").append(length - maxItems).append(" more");
            }
            sb.append("]");
            return sb.toString();
        }
        if (value instanceof ObjectReference) {
            ReferenceType refType = ((ObjectReference) value).referenceType();
            return refType.name() + "@" + Integer.toHexString(value.hashCode());
        }
        return value.toString();
    }

    public static String formatTypeName(String signature) {
        if (signature == null) return "unknown";
        return switch (signature) {
            case "I" -> "int";
            case "J" -> "long";
            case "D" -> "double";
            case "F" -> "float";
            case "Z" -> "boolean";
            case "C" -> "char";
            case "B" -> "byte";
            case "S" -> "short";
            case "V" -> "void";
            default -> {
                if (signature.startsWith("L") && signature.endsWith(";")) {
                    String className = signature.substring(1, signature.length() - 1).replace('/', '.');
                    yield className.contains(".") ? className.substring(className.lastIndexOf('.') + 1) : className;
                } else if (signature.startsWith("[")) {
                    yield formatTypeName(signature.substring(1)) + "[]";
                }
                yield signature;
            }
        };
    }
}
