/**
 * Dummy credential data for 3 issuers: Google, Udemy, Jaimin Pvt Ltd
 * Each issuer uses slightly different field names to simulate real-world differences.
 */

// --------------------------------------------------------------------------
// Google Certificates — field names: learner_email, learner_name, title, etc.
// --------------------------------------------------------------------------
const googleCredentials = [
  { id: '1', learner_email: 'jaimin@gmail.com',   learner_name: 'Jaimin Detroja',   title: 'Google Cloud Fundamentals: Core Infrastructure', issued_date: '2024-03-15', description: 'Completed Google Cloud Fundamentals covering IaaS, PaaS, and core GCP services.' },
  { id: '2', learner_email: 'bob@example.com',     learner_name: 'Bob Smith',       title: 'Google AI Essentials',                            issued_date: '2024-04-20', description: 'Learned the fundamentals of AI and machine learning with Google tools.' },
  { id: '3', learner_email: 'carol@example.com',   learner_name: 'Carol White',     title: 'Google Project Management Certificate',           issued_date: '2024-01-10', description: 'Professional certificate covering Agile, Scrum, and project execution.' },
  { id: '4', learner_email: 'dave@example.com',    learner_name: 'Dave Brown',      title: 'Google Data Analytics Certificate',               issued_date: '2024-05-05', description: 'Data analytics using spreadsheets, SQL, R and Tableau.' },
  { id: '5', learner_email: 'eve@example.com',     learner_name: 'Eve Davis',       title: 'Google Cybersecurity Certificate',                issued_date: '2024-02-28', description: 'Foundations of cybersecurity, risk management, and incident response.' },
  { id: '6', learner_email: 'frank@example.com',   learner_name: 'Frank Wilson',    title: 'Google UX Design Certificate',                   issued_date: '2024-06-12', description: 'User experience design process, wireframing, prototyping, and testing.' },
  { id: '7', learner_email: 'grace@example.com',   learner_name: 'Grace Martinez',  title: 'Google IT Support Certificate',                  issued_date: '2024-07-08', description: 'IT support fundamentals, networking, operating systems, and security.' },
  { id: '8', learner_email: 'henry@example.com',   learner_name: 'Henry Lee',       title: 'Google Digital Marketing Certificate',           issued_date: '2024-08-14', description: 'Digital marketing and e-commerce fundamentals for modern businesses.' },
  { id: '9', learner_email: 'iris@example.com',    learner_name: 'Iris Chen',       title: 'Google Advanced Data Analytics Certificate',     issued_date: '2024-09-01', description: 'Advanced statistical analysis, machine learning, and predictive modeling.' },
  { id: '10', learner_email: 'jack@example.com',   learner_name: 'Jack Anderson',   title: 'Google Business Intelligence Certificate',       issued_date: '2024-10-11', description: 'Business intelligence, data modeling, and dashboard design with Looker.' },
];

// --------------------------------------------------------------------------
// Udemy Courses — field names: student_email, student_name, course_title, etc.
// --------------------------------------------------------------------------
const udemyCredentials = [
  { id: '1', student_email: 'alice@example.com',   student_name: 'Alice Johnson',  course_title: 'The Complete Node.js Developer Course',   completion_date: '2024-02-10', course_description: 'Comprehensive Node.js covering REST APIs, Socket.io, MongoDB, and deployment.' },
  { id: '2', student_email: 'bob@example.com',     student_name: 'Bob Smith',      course_title: 'React - The Complete Guide 2024',          completion_date: '2024-03-25', course_description: 'Hooks, Redux, React Router, Next.js and full-stack integration.' },
  { id: '3', student_email: 'carol@example.com',   student_name: 'Carol White',    course_title: 'Python Bootcamp: Zero to Hero',            completion_date: '2024-04-02', course_description: 'Python fundamentals, OOP, decorators, generators, and real-world projects.' },
  { id: '4', student_email: 'dave@example.com',    student_name: 'Dave Brown',     course_title: 'Machine Learning A-Z with Python & R',     completion_date: '2024-05-18', course_description: 'Regression, classification, clustering, NLP, and reinforcement learning.' },
  { id: '5', student_email: 'eve@example.com',     student_name: 'Eve Davis',      course_title: 'Docker & Kubernetes: The Practical Guide', completion_date: '2024-06-30', course_description: 'Containers, orchestration, microservices deployment on Kubernetes.' },
  { id: '6', student_email: 'frank@example.com',   student_name: 'Frank Wilson',   course_title: 'AWS Certified Developer Associate 2024',   completion_date: '2024-07-22', course_description: 'AWS core services, Lambda, DynamoDB, API Gateway and S3 for developers.' },
  { id: '7', student_email: 'grace@example.com',   student_name: 'Grace Martinez', course_title: 'TypeScript: The Complete Developer Guide', completion_date: '2024-01-15', course_description: 'Type system, interfaces, generics, decorators and advanced TypeScript patterns.' },
  { id: '8', student_email: 'henry@example.com',   student_name: 'Henry Lee',      course_title: 'SQL Masterclass for Data Analysts',        completion_date: '2024-08-05', course_description: 'Advanced SQL, window functions, CTEs, query optimization and PostgreSQL.' },
  { id: '9', student_email: 'iris@example.com',    student_name: 'Iris Chen',      course_title: 'iOS & Swift - The Complete iOS App Dev Bootcamp', completion_date: '2024-09-19', course_description: 'Swift, UIKit, SwiftUI, Core Data, ARKit and App Store deployment.' },
  { id: '10', student_email: 'jack@example.com',   student_name: 'Jack Anderson',  course_title: 'DevOps Beginners to Advanced with Projects', completion_date: '2024-10-28', course_description: 'CI/CD pipelines, Jenkins, Ansible, Terraform, and monitoring with Prometheus.' },
];

// --------------------------------------------------------------------------
// Jaimin Pvt Ltd — field names: trainee_email, trainee_name, program_name, etc.
// --------------------------------------------------------------------------
const jaiminCredentials = [
  { id: '1', trainee_email: 'alice@example.com',   trainee_name: 'Alice Johnson',  program_name: 'Industrial IoT Fundamentals',          awarded_on: '2024-01-20', program_desc: 'Hands-on training on sensors, MQTT, edge computing, and IIoT architecture.' },
  { id: '2', trainee_email: 'bob@example.com',     trainee_name: 'Bob Smith',      program_name: 'Advanced Embedded Systems Design',    awarded_on: '2024-02-14', program_desc: 'ARM Cortex-M, RTOS, PCB design and firmware development for industrial use.' },
  { id: '3', trainee_email: 'carol@example.com',   trainee_name: 'Carol White',    program_name: 'VLSI Design with Cadence Tools',       awarded_on: '2024-03-08', program_desc: 'RTL design, synthesis, place-and-route, timing analysis using Cadence.' },
  { id: '4', trainee_email: 'dave@example.com',    trainee_name: 'Dave Brown',     program_name: 'Power Electronics and Drives',         awarded_on: '2024-04-22', program_desc: 'DC-DC converters, inverters, motor drives design and simulation.' },
  { id: '5', trainee_email: 'eve@example.com',     trainee_name: 'Eve Davis',      program_name: 'PLC and SCADA Programming',            awarded_on: '2024-05-11', program_desc: 'Siemens S7, ladder logic, HMI integration, and SCADA system architecture.' },
  { id: '6', trainee_email: 'frank@example.com',   trainee_name: 'Frank Wilson',   program_name: 'Robotics and Automation',              awarded_on: '2024-06-03', program_desc: 'Robotic kinematics, ROS 2, path planning, and collaborative robot programming.' },
  { id: '7', trainee_email: 'grace@example.com',   trainee_name: 'Grace Martinez', program_name: 'Wireless Communication Systems',       awarded_on: '2024-07-17', program_desc: '5G NR, Bluetooth LE, LoRaWAN, antenna design, and RF simulation.' },
  { id: '8', trainee_email: 'henry@example.com',   trainee_name: 'Henry Lee',      program_name: 'Digital Signal Processing',            awarded_on: '2024-08-29', program_desc: 'DSP fundamentals, FFT, filter design, real-time implementation on DSPs.' },
  { id: '9', trainee_email: 'iris@example.com',    trainee_name: 'Iris Chen',      program_name: 'AI at the Edge: TinyML Training',      awarded_on: '2024-09-12', program_desc: 'TensorFlow Lite, model quantization, deployment on microcontrollers.' },
  { id: '10', trainee_email: 'jack@example.com',   trainee_name: 'Jack Anderson',  program_name: 'Circuit Design and PCB Fabrication',   awarded_on: '2024-10-06', program_desc: 'Schematic capture, PCB layout with KiCad, DFM rules, and prototype testing.' },
];

module.exports = { googleCredentials, udemyCredentials, jaiminCredentials };
