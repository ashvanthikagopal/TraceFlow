public class Sample {
    public static void main(String[] args) {
        // Variable declarations with expressions
        int a = 10;
        int b = 20;
        int sum = a + b;
        int product = a * b;
        double average = (a + b) / 2.0;
        String greeting = "TraceFlow";
        boolean isActive = true;

        System.out.println("Starting Program Execution");
        System.out.println("Sum of a and b: " + sum);
        System.out.println("Product of a and b: " + product);
        System.out.println("Average: " + average);

        // Control Flow: If-Else Condition
        if (sum > 25) {
            System.out.println("Sum is greater than 25");
        } else {
            System.out.println("Sum is 25 or less");
        }

        // Control Flow: For Loop
        int loopTotal = 0;
        for (int i = 1; i <= 3; i++) {
            loopTotal = loopTotal + i;
            System.out.println("Loop iteration step: " + i);
        }

        // Control Flow: While Loop
        int count = 2;
        while (count > 0) {
            System.out.println("Countdown: " + count);
            count = count - 1;
        }

        System.out.println("Execution Completed Successfully");
    }
}
