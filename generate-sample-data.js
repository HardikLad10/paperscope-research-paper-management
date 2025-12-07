// Generate sample data for 1000+ papers from top CS conferences
// Run with: node generate-sample-data.js > sample_data.sql

const conferences = [
  { id: 'V001', name: 'NeurIPS', type: 'Conference', publisher: 'Neural Information Processing Systems', year: 2024 },
  { id: 'V002', name: 'ICCV', type: 'Conference', publisher: 'IEEE', year: 2023 },
  { id: 'V003', name: 'CVPR', type: 'Conference', publisher: 'IEEE', year: 2024 },
  { id: 'V004', name: 'ICML', type: 'Conference', publisher: 'JMLR', year: 2024 },
  { id: 'V005', name: 'ICLR', type: 'Conference', publisher: 'OpenReview', year: 2024 },
  { id: 'V006', name: 'ACL', type: 'Conference', publisher: 'ACL', year: 2024 },
  { id: 'V007', name: 'EMNLP', type: 'Conference', publisher: 'ACL', year: 2023 },
  { id: 'V008', name: 'AAAI', type: 'Conference', publisher: 'AAAI', year: 2024 },
  { id: 'V009', name: 'SIGGRAPH', type: 'Conference', publisher: 'ACM', year: 2024 },
  { id: 'V010', name: 'SIGKDD', type: 'Conference', publisher: 'ACM', year: 2024 },
  { id: 'V011', name: 'WWW', type: 'Conference', publisher: 'ACM', year: 2024 },
  { id: 'V012', name: 'SIGIR', type: 'Conference', publisher: 'ACM', year: 2024 },
  { id: 'V013', name: 'CHI', type: 'Conference', publisher: 'ACM', year: 2024 },
  { id: 'V014', name: 'SIGMOD', type: 'Conference', publisher: 'ACM', year: 2024 },
  { id: 'V015', name: 'VLDB', type: 'Conference', publisher: 'VLDB Endowment', year: 2024 },
];

const topics = [
  'Deep Learning', 'Computer Vision', 'Natural Language Processing', 'Reinforcement Learning',
  'Graph Neural Networks', 'Transformers', 'Generative Models', 'Federated Learning',
  'Adversarial Learning', 'Meta-Learning', 'Few-Shot Learning', 'Transfer Learning',
  'Self-Supervised Learning', 'Contrastive Learning', 'Attention Mechanisms', 'Neural Architecture Search',
  'Explainable AI', 'Fairness in ML', 'Robustness', 'Efficient ML', 'Edge Computing', 'Distributed Systems'
];

const methods = [
  'Transformer', 'CNN', 'RNN', 'GAN', 'VAE', 'Diffusion Model', 'Graph Convolution',
  'Attention', 'Self-Attention', 'Multi-Head Attention', 'BERT', 'GPT', 'ResNet',
  'EfficientNet', 'Vision Transformer', 'CLIP', 'DALL-E', 'Stable Diffusion'
];

const datasets = [
  { id: 'D001', name: 'ImageNet', url: 'https://image-net.org/', domain: 'Computer Vision', access: 'public' },
  { id: 'D002', name: 'COCO', url: 'https://cocodataset.org/', domain: 'Computer Vision', access: 'public' },
  { id: 'D003', name: 'GLUE', url: 'https://gluebenchmark.com/', domain: 'NLP', access: 'public' },
  { id: 'D004', name: 'SQuAD', url: 'https://rajpurkar.github.io/SQuAD-explorer/', domain: 'NLP', access: 'public' },
  { id: 'D005', name: 'CIFAR-10', url: 'https://www.cs.toronto.edu/~kriz/cifar.html', domain: 'Computer Vision', access: 'public' },
  { id: 'D006', name: 'MNIST', url: 'http://yann.lecun.com/exdb/mnist/', domain: 'Computer Vision', access: 'public' },
  { id: 'D007', name: 'WikiText', url: 'https://blog.salesforceairesearch.com/the-wikitext-long-term-dependency-language-modeling-dataset/', domain: 'NLP', access: 'public' },
  { id: 'D008', name: 'OpenImages', url: 'https://storage.googleapis.com/openimages/web/index.html', domain: 'Computer Vision', access: 'public' },
];

const firstNames = ['Alex', 'Jordan', 'Taylor', 'Morgan', 'Casey', 'Riley', 'Avery', 'Quinn', 'Sage', 'River', 'Skyler', 'Cameron', 'Dakota', 'Emery', 'Finley'];
const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Thompson', 'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson', 'Walker', 'Young', 'King', 'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill', 'Flores', 'Green', 'Adams', 'Nelson'];

function randomElement(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function generatePaperTitle(topic, method) {
  const prefixes = ['Efficient', 'Robust', 'Scalable', 'Adaptive', 'Deep', 'Neural', 'Learning-based', 'Attention-based', 'Transformer-based'];
  const suffixes = ['for', 'in', 'with', 'via', 'using', 'through'];
  const actions = ['Classification', 'Detection', 'Generation', 'Recognition', 'Understanding', 'Analysis', 'Prediction', 'Optimization'];
  
  if (Math.random() > 0.5) {
    return `${randomElement(prefixes)} ${topic} ${randomElement(actions)} ${randomElement(suffixes)} ${randomElement(methods)}`;
  } else {
    return `${method}-based ${topic}: ${randomElement(actions)} and ${randomElement(actions)}`;
  }
}

function generateAbstract(title) {
  const sentences = [
    `This paper presents a novel approach to ${title.toLowerCase()}.`,
    `We propose an efficient method that addresses key challenges in this domain.`,
    `Our approach leverages state-of-the-art techniques to achieve significant improvements.`,
    `Experimental results demonstrate the effectiveness of our method across multiple benchmarks.`,
    `We evaluate our approach on standard datasets and show consistent performance gains.`,
    `The proposed method outperforms existing baselines by a significant margin.`,
    `We provide extensive ablation studies and analysis of the key components.`,
    `Our work contributes to the growing body of research in this area.`
  ];
  
  return sentences.slice(0, randomInt(4, 6)).join(' ');
}

function generateUserId(index) {
  return `U${String(index).padStart(3, '0')}`;
}

function generatePaperId(index) {
  return `P${String(index).padStart(3, '0')}`;
}

function generateReviewId(index) {
  return `R${String(index).padStart(3, '0')}`;
}

function generateVenueId(index) {
  return `V${String(index).padStart(3, '0')}`;
}

function generateProjectId(index) {
  return `PR${String(index).padStart(3, '0')}`;
}

// Generate data
console.log('-- Sample Data Generation for PaperScope Database');
console.log('-- Generated: ' + new Date().toISOString());
console.log('-- Total: 1000+ papers from top CS conferences');
console.log('');

// Users (200 users)
console.log('-- ============================================================');
console.log('-- USERS (200 users)');
console.log('-- ============================================================');
console.log('INSERT INTO Users (user_id, user_name, email, password, affiliation, profile_url, is_reviewer) VALUES');

const users = [];
for (let i = 1; i <= 200; i++) {
  const userId = generateUserId(i);
  const firstName = randomElement(firstNames);
  const lastName = randomElement(lastNames);
  const userName = `${firstName} ${lastName}`;
  const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}@cs411.edu`;
  const password = `${firstName}@123`;
  const affiliation = randomElement(['UIUC', 'MIT', 'Stanford', 'CMU', 'Berkeley', 'Google', 'Microsoft', 'Meta', 'OpenAI', 'DeepMind']);
  const profileUrl = `https://example.com/profiles/${userId}`;
  const isReviewer = Math.random() > 0.3 ? '1' : '0'; // 70% are reviewers
  
  users.push({ userId, userName, email, password, affiliation, profileUrl, isReviewer });
  
  const comma = i < 200 ? ',' : ';';
  console.log(`('${userId}', '${userName}', '${email}', '${password}', '${affiliation}', '${profileUrl}', '${isReviewer}')${comma}`);
}

// Venues (already have some, add more if needed)
console.log('');
console.log('-- ============================================================');
console.log('-- VENUES (15 top CS conferences)');
console.log('-- ============================================================');
console.log('INSERT IGNORE INTO Venues (venue_id, venue_name, venue_type, publisher, year) VALUES');
conferences.forEach((v, i) => {
  const comma = i < conferences.length - 1 ? ',' : ';';
  console.log(`('${v.id}', '${v.name}', '${v.type}', '${v.publisher}', ${v.year})${comma}`);
});

// Datasets
console.log('');
console.log('-- ============================================================');
console.log('-- DATASETS');
console.log('-- ============================================================');
console.log('INSERT IGNORE INTO Datasets (dataset_id, dataset_name, dataset_url, domain, access_type) VALUES');
datasets.forEach((d, i) => {
  const comma = i < datasets.length - 1 ? ',' : ';';
  console.log(`('${d.id}', '${d.name}', '${d.url}', '${d.domain}', '${d.access}')${comma}`);
});

// Projects (50 projects)
console.log('');
console.log('-- ============================================================');
console.log('-- PROJECTS (50 projects)');
console.log('-- ============================================================');
console.log('INSERT IGNORE INTO Projects (project_id, project_title, description, project_date) VALUES');

const projects = [];
for (let i = 1; i <= 50; i++) {
  const projectId = generateProjectId(i);
  const topic = randomElement(topics);
  const projectTitle = `${topic} Research Project`;
  const description = `Research project focusing on ${topic} and related methodologies`;
  const projectDate = randomDate(new Date(2023, 0, 1), new Date(2024, 11, 31)).toISOString().split('T')[0];
  
  projects.push({ projectId, projectTitle, description, projectDate });
  
  const comma = i < 50 ? ',' : ';';
  console.log(`('${projectId}', '${projectTitle}', '${description}', '${projectDate}')${comma}`);
}

// Papers (1000 papers)
console.log('');
console.log('-- ============================================================');
console.log('-- PAPERS (1000 papers)');
console.log('-- ============================================================');
console.log('INSERT IGNORE INTO Papers (paper_id, paper_title, abstract, pdf_url, upload_timestamp, status, venue_id, dataset_id, project_id) VALUES');

const papers = [];
const statuses = ['Published', 'Under Review', 'In Review', 'Draft'];
const statusWeights = [0.6, 0.2, 0.15, 0.05]; // 60% published, 20% under review, etc.

function weightedRandomStatus() {
  const rand = Math.random();
  let sum = 0;
  for (let i = 0; i < statuses.length; i++) {
    sum += statusWeights[i];
    if (rand <= sum) return statuses[i];
  }
  return statuses[0];
}

for (let i = 1; i <= 1000; i++) {
  const paperId = generatePaperId(i);
  const topic = randomElement(topics);
  const method = randomElement(methods);
  const paperTitle = generatePaperTitle(topic, method);
  const abstract = generateAbstract(paperTitle);
  const pdfUrl = `/pdfs/${paperId.toLowerCase()}.pdf`;
  const uploadTimestamp = randomDate(new Date(2023, 0, 1), new Date(2024, 11, 31));
  const uploadTimestampStr = uploadTimestamp.toISOString().slice(0, 19).replace('T', ' ');
  const status = weightedRandomStatus();
  const venue = randomElement(conferences);
  const dataset = randomElement(datasets);
  const project = randomElement(projects);
  
  papers.push({ paperId, paperTitle, abstract, pdfUrl, uploadTimestamp: uploadTimestampStr, status, venueId: venue.id, datasetId: dataset.id, projectId: project.projectId });
  
  const comma = i < 1000 ? ',' : ';';
  const abstractEscaped = abstract.replace(/'/g, "''");
  console.log(`('${paperId}', '${paperTitle.replace(/'/g, "''")}', '${abstractEscaped}', '${pdfUrl}', '${uploadTimestampStr}', '${status}', '${venue.id}', '${dataset.id}', '${project.projectId}')${comma}`);
}

// Authorship (2-5 authors per paper, ~3000 authorship records)
console.log('');
console.log('-- ============================================================');
console.log('-- AUTHORSHIP (~3000 records, 2-5 authors per paper)');
console.log('-- ============================================================');
console.log('INSERT IGNORE INTO Authorship (user_id, paper_id) VALUES');

let authorshipCount = 0;
const authorshipEntries = [];
papers.forEach(paper => {
  const numAuthors = randomInt(2, 5);
  const selectedUsers = [];
  for (let i = 0; i < numAuthors; i++) {
    let user;
    do {
      user = randomElement(users);
    } while (selectedUsers.includes(user.userId));
    selectedUsers.push(user.userId);
    authorshipEntries.push({ userId: user.userId, paperId: paper.paperId });
  }
});

authorshipEntries.forEach((entry, i) => {
  const comma = i < authorshipEntries.length - 1 ? ',' : ';';
  console.log(`('${entry.userId}', '${entry.paperId}')${comma}`);
});

// Reviews (only for published/under review papers, ~2000 reviews)
console.log('');
console.log('-- ============================================================');
console.log('-- REVIEWS (~2000 reviews)');
console.log('-- ============================================================');
console.log('INSERT IGNORE INTO Reviews (review_id, user_id, paper_id, comment, review_timestamp) VALUES');

const reviewComments = [
  'Solid experimental design and thorough evaluation.',
  'The methodology is sound and well-presented.',
  'Interesting approach, but needs more comparison with baselines.',
  'Good contribution to the field with clear writing.',
  'The paper addresses an important problem effectively.',
  'Strong theoretical foundation with practical applications.',
  'Well-written paper with comprehensive experiments.',
  'Novel approach with promising results.',
  'The work demonstrates significant improvements over existing methods.',
  'Clear presentation of the problem and solution.',
  'Good use of state-of-the-art techniques.',
  'The experimental setup is comprehensive and fair.',
  'Interesting findings that contribute to the field.',
  'Well-motivated research with clear contributions.',
  'The paper provides valuable insights into the problem domain.'
];

let reviewCount = 0;
const reviews = [];
const reviewedPapers = papers.filter(p => p.status !== 'Draft');
reviewedPapers.forEach(paper => {
  const numReviews = randomInt(1, 4);
  const reviewerUsers = users.filter(u => u.isReviewer === '1');
  
  for (let i = 0; i < numReviews && i < reviewerUsers.length; i++) {
    reviewCount++;
    const reviewId = generateReviewId(reviewCount);
    const reviewer = randomElement(reviewerUsers);
    // Make sure reviewer didn't author this paper
    const isAuthor = authorshipEntries.some(a => a.paperId === paper.paperId && a.userId === reviewer.userId);
    if (isAuthor) continue;
    
    const comment = randomElement(reviewComments);
    const reviewDate = new Date(paper.uploadTimestamp);
    reviewDate.setDate(reviewDate.getDate() + randomInt(7, 60)); // Review 1-2 months after upload
    const reviewTimestamp = reviewDate.toISOString().slice(0, 19).replace('T', ' ');
    
    reviews.push({ reviewId, userId: reviewer.userId, paperId: paper.paperId, comment, reviewTimestamp });
  }
});

reviews.forEach((review, i) => {
  const comma = i < reviews.length - 1 ? ',' : ';';
  const commentEscaped = review.comment.replace(/'/g, "''");
  console.log(`('${review.reviewId}', '${review.userId}', '${review.paperId}', '${commentEscaped}', '${review.reviewTimestamp}')${comma}`);
});

// RelatedPapers (random relationships, ~500)
console.log('');
console.log('-- ============================================================');
console.log('-- RELATED PAPERS (~500 relationships)');
console.log('-- ============================================================');
console.log('INSERT IGNORE INTO RelatedPapers (paper_id, related_paper_id) VALUES');

const relatedPairs = [];
const usedPairs = new Set();
for (let i = 0; i < 500; i++) {
  const paper1 = randomElement(papers);
  let paper2;
  do {
    paper2 = randomElement(papers);
  } while (paper2.paperId === paper1.paperId);
  
  const pairKey = [paper1.paperId, paper2.paperId].sort().join('-');
  if (!usedPairs.has(pairKey)) {
    usedPairs.add(pairKey);
    relatedPairs.push({ paper1: paper1.paperId, paper2: paper2.paperId });
  }
}

relatedPairs.forEach((pair, i) => {
  const comma = i < relatedPairs.length - 1 ? ',' : ';';
  console.log(`('${pair.paper1}', '${pair.paper2}')${comma}`);
});

console.log('');
console.log('-- ============================================================');
console.log('-- DATA GENERATION COMPLETE');
console.log('-- ============================================================');
console.log('-- Summary:');
console.log(`-- Users: 200`);
console.log(`-- Venues: ${conferences.length}`);
console.log(`-- Datasets: ${datasets.length}`);
console.log(`-- Projects: 50`);
console.log(`-- Papers: 1000`);
console.log(`-- Authorship: ~${authorshipEntries.length}`);
console.log(`-- Reviews: ~${reviews.length}`);
console.log(`-- RelatedPapers: ~${relatedPairs.length}`);

