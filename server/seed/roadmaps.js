/**
 * Career roadmap seed data (spec §29): 9 roles with realistic step-by-step
 * guides. Imported by seed/seed.js; each roadmap is upserted by role.
 */

export const ROADMAP_SEEDS = [
  {
    role: 'software_engineer',
    title: 'Software Engineer Roadmap',
    description: 'From fundamentals to landing a software engineering role — the complete path.',
    steps: [
      { title: 'Programming fundamentals', description: 'Master one language deeply (Python/C++/Java). Learn variables, loops, functions, OOP, and debugging.', duration: '2-3 months', resources: ['Python.org tutorial', 'CS50x (Harvard)'] },
      { title: 'Data structures & algorithms', description: 'Arrays, strings, linked lists, trees, graphs, DP. Practice daily on LeetCode — start with easy, graduate to medium.', duration: '3-4 months', resources: ['LeetCode', 'NeetCode roadmap', 'CLRS (selected chapters)'] },
      { title: 'Computer science core', description: 'OS, DBMS, networking, and system design fundamentals — the concepts behind every interview question.', duration: '2-3 months', resources: ['OS: OSTEP', 'GATE CS notes (resources tab)'] },
      { title: 'Web development (full-stack)', description: 'Build real projects: HTML/CSS/JS, a backend (Node/Python), a database, and deploy. Ship 3+ projects.', duration: '3-4 months', resources: ['MERN crash course (resources tab)', 'The Odin Project'] },
      { title: 'Interview preparation', description: 'Mock interviews weekly, behavioral stories, system design basics, and resume polish. Apply to 100+ roles.', duration: '2-3 months', resources: ['Cracking the Coding Interview', 'Pramp (free mock interviews)'] },
    ],
  },
  {
    role: 'data_scientist',
    title: 'Data Scientist Roadmap',
    description: 'Statistics, machine learning, and storytelling — the path to a data science career.',
    steps: [
      { title: 'Math & statistics foundations', description: 'Linear algebra, calculus, probability, and statistics. These power every algorithm you will use.', duration: '2-3 months', resources: ['Khan Academy — Statistics', '3Blue1Brown linear algebra'] },
      { title: 'Python for data science', description: 'NumPy, Pandas, Matplotlib, Seaborn. Learn data wrangling and EDA on real datasets.', duration: '2 months', resources: ['Kaggle Learn — Python', 'Pandas documentation'] },
      { title: 'Machine learning fundamentals', description: 'Regression, classification, clustering, decision trees, and evaluation metrics. Implement from scratch once.', duration: '3 months', resources: ['Andrew Ng ML course', 'Hands-On ML (Géron)'] },
      { title: 'Deep learning & specialization', description: 'Neural networks, CNNs, RNNs/transformers. Build 2-3 projects (NLP, CV) with PyTorch/TensorFlow.', duration: '3-4 months', resources: ['Fast.ai', 'DeepLearning.AI specialization'] },
      { title: 'Portfolio & interviews', description: '4+ portfolio projects, Kaggle competitions, SQL practice, and case-study interview prep.', duration: '2-3 months', resources: ['Kaggle competitions', 'StrataScratch SQL practice'] },
    ],
  },
  {
    role: 'ai_engineer',
    title: 'AI Engineer Roadmap',
    description: 'From ML engineer to building production AI systems with LLMs and MLOps.',
    steps: [
      { title: 'ML + deep learning core', description: 'Solidify ML fundamentals and deep learning: backprop, optimizers, CNNs, transformers.', duration: '3-4 months', resources: ['DeepLearning.AI', 'Hands-On ML'] },
      { title: 'LLM engineering', description: 'Prompt engineering, RAG, fine-tuning, embeddings, and vector databases.', duration: '2-3 months', resources: ['Hugging Face course', 'LangChain docs'] },
      { title: 'MLOps', description: 'Model deployment, monitoring, CI/CD for ML, Docker, and cloud ML services.', duration: '2-3 months', resources: ['MLOps Zoomcamp', 'Docker docs'] },
      { title: 'Production projects', description: 'Ship 2 end-to-end AI products: data pipeline → model → API → monitoring.', duration: '3 months', resources: ['Kaggle', 'AWS SageMaker docs'] },
    ],
  },
  {
    role: 'web_developer',
    title: 'Web Developer Roadmap',
    description: 'Frontend, backend, or full-stack — the complete web development path.',
    steps: [
      { title: 'HTML, CSS & JavaScript', description: 'Semantic HTML, responsive CSS (Flexbox/Grid), and modern JavaScript (ES6+).', duration: '2-3 months', resources: ['The Odin Project', 'MDN Web Docs'] },
      { title: 'Frontend framework', description: 'React (most in-demand) — components, hooks, state management, routing, and testing.', duration: '2-3 months', resources: ['React docs', 'Epic React (free tier)'] },
      { title: 'Backend & databases', description: 'Node.js/Express or Django, REST APIs, SQL + NoSQL, authentication, and deployment.', duration: '3 months', resources: ['MERN course (resources tab)', 'PostgreSQL tutorial'] },
      { title: 'Projects & portfolio', description: 'Build 5+ projects — an e-commerce clone, a chat app, a dashboard. Deploy them all.', duration: '3 months', resources: ['Frontend Mentor', 'Vercel/Netlify docs'] },
    ],
  },
  {
    role: 'cloud_engineer',
    title: 'Cloud Engineer Roadmap',
    description: 'AWS/Azure/GCP fundamentals through architecting scalable systems.',
    steps: [
      { title: 'Networking & Linux', description: 'TCP/IP, DNS, HTTP, and Linux administration — the foundation of the cloud.', duration: '2 months', resources: ['Linux journey', 'Computer Networking (Kurose)'] },
      { title: 'Cloud fundamentals', description: 'Pick a provider (AWS recommended). Compute, storage, networking, IAM, and billing.', duration: '2-3 months', resources: ['AWS Skill Builder', 'AWS free tier labs'] },
      { title: 'Certification path', description: 'AWS Cloud Practitioner → Solutions Architect Associate. Practice exams included.', duration: '2-3 months', resources: ['AWS SAA course', 'Tutorials Dojo practice exams'] },
      { title: 'Infrastructure as code', description: 'Terraform, CloudFormation, CI/CD pipelines, and container orchestration (ECS/K8s).', duration: '3 months', resources: ['Terraform docs', 'Kubernetes docs'] },
    ],
  },
  {
    role: 'devops_engineer',
    title: 'DevOps Engineer Roadmap',
    description: 'Automation, CI/CD, containers, and reliability engineering.',
    steps: [
      { title: 'Linux + scripting', description: 'Linux internals, Bash/Python scripting, and system administration.', duration: '2 months', resources: ['Linux journey', 'Automate the Boring Stuff'] },
      { title: 'Containers & orchestration', description: 'Docker deeply, then Kubernetes: pods, services, deployments, and Helm.', duration: '3 months', resources: ['Docker docs', 'Kubernetes docs', 'KodeKloud'] },
      { title: 'CI/CD & automation', description: 'GitHub Actions/Jenkins, infrastructure as code (Terraform), and configuration management (Ansible).', duration: '2-3 months', resources: ['GitHub Actions docs', 'Terraform docs'] },
      { title: 'Observability & SRE', description: 'Prometheus, Grafana, logging (ELK/Loki), incident response, and SRE practices.', duration: '2-3 months', resources: ['Prometheus docs', 'Google SRE book'] },
    ],
  },
  {
    role: 'cybersecurity',
    title: 'Cybersecurity Roadmap',
    description: 'From network security to penetration testing and blue-team defense.',
    steps: [
      { title: 'Foundations', description: 'Networking (TCP/IP), Linux, Windows internals, and cryptography basics.', duration: '2-3 months', resources: ['TryHackMe beginner path', 'Crypto 101'] },
      { title: 'Security concepts', description: 'Web app security (OWASP Top 10), network security, and identity/access management.', duration: '2-3 months', resources: ['OWASP Top 10', 'PortSwigger Academy'] },
      { title: 'Hands-on labs', description: 'Practice on vulnerable machines: TryHackMe, HackTheBox, and CTF competitions.', duration: '3 months', resources: ['TryHackMe', 'HackTheBox', 'picoCTF'] },
      { title: 'Certifications', description: 'Security+ (foundation) → CEH or OSCP track depending on your focus (offensive vs defensive).', duration: '3-4 months', resources: ['CompTIA Security+ prep', 'OSCP guide'] },
    ],
  },
  {
    role: 'gate',
    title: 'GATE (CS/IT) Roadmap',
    description: 'A structured plan to crack GATE CSE with a strong rank.',
    steps: [
      { title: 'Syllabus & strategy', description: 'Understand the syllabus, weightage (DSA ~15%, DBMS ~10%, OS ~12%), and create a study schedule.', duration: '1 month', resources: ['GATE official syllabus', 'Previous year papers (resources tab)'] },
      { title: 'Core subjects — part 1', description: 'Discrete math, DSA, and algorithms — the highest-weightage subjects with the most scoring potential.', duration: '3-4 months', resources: ['NPTEL lectures', 'CLRS selected chapters'] },
      { title: 'Core subjects — part 2', description: 'DBMS, OS, computer networks, COA, and compiler design with PYQ practice after each subject.', duration: '4-5 months', resources: ['GATE PYQ compilation (resources tab)', 'NPTEL'] },
      { title: 'Test series & revision', description: 'Full-length mock tests weekly, sectional tests, error log, and formula revision. Target 40+ mocks.', duration: '3-4 months', resources: ['Made Easy/ACE test series', 'Gate Overflow'] },
    ],
  },
  {
    role: 'government_jobs',
    title: 'Government Jobs Roadmap',
    description: 'SSC, banking, railways, and state exams — a complete preparation strategy.',
    steps: [
      { title: 'Choose your exam', description: 'Research exams matching your profile: SSC CGL, IBPS PO, RRB, state PCS, or UPSC. Check eligibility and pattern.', duration: '1 month', resources: ['Exam official websites', 'Previous year cut-offs'] },
      { title: 'Quantitative aptitude', description: 'Number systems, percentages, time & work, DI — daily practice is non-negotiable.', duration: '2-3 months', resources: ['Aptitude practice set (resources tab)', 'R.S. Aggarwal'] },
      { title: 'Reasoning + English', description: 'Logical reasoning, puzzles, and English (grammar, comprehension, vocabulary).', duration: '2-3 months', resources: ['M.K. Pandey reasoning', 'Wren & Martin'] },
      { title: 'General awareness', description: 'Current affairs (monthly capsules), static GK, and banking/economy awareness.', duration: 'Ongoing', resources: ['Monthly current affairs', 'Lucent GK'] },
      { title: 'Mocks & revision', description: 'Sectional + full mocks, speed drills, and previous year papers under timed conditions.', duration: '2-3 months', resources: ['Test series (Oliveboard/Testbook)', 'PYQ papers'] },
    ],
  },
];
