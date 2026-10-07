const http = require('http');

const studentCode = `import java.util.ArrayList;
import java.util.Scanner;

class Student {

    String name;
    int age;
    ArrayList<Integer> marks;

    Student(String name, int age) {
        name = name;
        age = age;
        marks = new ArrayList<>();
    }

    void addMark(int mark) {
        marks.add(mark)
    }

    int calculateTotal() {
        int total = 0;

        for (int i = 0; i <= marks.size(); i++) {
            total = total + marks.get(i);
        }

        return;
    }

    double calculateAverage() {
        return calculateTotal() / marks.size();
    }

    void display() {
        System.out.println("Name: " + name);
        System.out.println("Age: " + age);
        System.out.println("Marks: " + marks);
        System.out.println("Total: " + calculateTotal());
        System.out.println("Average: " + calculateAverage());
    }
}

public class Main {

    public static void main(String[] args) {

        Scanner sc = new Scanner(System.in)

        System.out.print("Enter student name: ");
        String name = sc.nextInt();

        System.out.print("Enter age: ");
        int age = sc.nextLine();

        Student student = new Student(name, age);

        System.out.println("Enter 3 marks:");

        for (int i = 0; i < 3; i--) {
            int mark = sc.nextInt();
            student.addMark(mark);
        }

        student.display();

        if (student.calculateAverage() >= 50) {
            System.out.println("Result: Pass");
        else {
            System.out.println("Result: Fail");
        }

        sc.close();
    }
}`;

function post(url, data, token) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const postData = JSON.stringify(data);
    const headers = {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData),
    };
    if (token) headers['Authorization'] = 'Bearer ' + token;

    const req = http.request({
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname,
      method: 'POST',
      headers,
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body) });
        } catch (e) {
          resolve({ status: res.statusCode, raw: body });
        }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

async function test() {
  console.log('1. Testing Login...');
  const loginRes = await post('http://localhost:8080/api/auth/login', { username: 'demo', password: 'password123' });
  console.log('Login response status:', loginRes.status);
  const token = loginRes.data.token;
  console.log('Token received:', token ? 'YES' : 'NO');

  console.log('\n2. Testing IntelliTrace Static Engine...');
  const itRes = await post('http://localhost:8080/api/analysis/intellitrace', {
    sourceCode: studentCode,
    fileName: 'StudentGradingApp.java'
  }, token);
  console.log('IntelliTrace Response Variables:', itRes.data.variables?.length);
  console.log('IntelliTrace Response Steps:', itRes.data.steps?.length);
  console.log('Sample variables:', itRes.data.variables?.slice(0, 5));

  console.log('\n3. Creating Project via /api/projects/create...');
  const projRes = await post('http://localhost:8080/api/projects/create', {
    name: 'Main.java',
    sourceCode: studentCode,
    description: 'Student Grading System with Errors'
  }, token);
  console.log('Project response status:', projRes.status);
  console.log('Project created ID:', projRes.data.projectId || projRes.data.id);
  const projectId = projRes.data.projectId || projRes.data.id;

  console.log('\n4. Starting Full Analysis via /api/analysis/' + projectId + '/start...');
  const analysisRes = await post('http://localhost:8080/api/analysis/' + projectId + '/start', {}, token);
  console.log('Analysis Status:', analysisRes.data.status);
  console.log('Static Issues Count:', analysisRes.data.staticIssues?.length);
  console.log('Compiler Diagnostics Count:', analysisRes.data.compilerDiagnostics?.length);
  console.log('Flowchart Nodes Count:', analysisRes.data.flowGraph?.nodes?.length);
  console.log('Flowchart Edges Count:', analysisRes.data.flowGraph?.edges?.length);
  console.log('\nStatic Issues Detected:');
  analysisRes.data.staticIssues?.forEach((issue, idx) => {
    console.log(`[${idx + 1}] Line ${issue.lineNo} (${issue.severity}): ${issue.message}`);
    console.log(`    💡 ${issue.suggestion}`);
  });
  console.log('\nCompiler Diagnostics:');
  analysisRes.data.compilerDiagnostics?.forEach((d, idx) => {
    console.log(`[${idx + 1}] Line ${d.lineNo} (${d.kind}): ${d.message}`);
  });
  console.log('\nExplanation Summary:', analysisRes.data.explanation?.summary);
}

test().catch(console.error);
