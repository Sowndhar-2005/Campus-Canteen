import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/campus-canteen';

// ═══════════════════════════════════════════════════════
// Department Configuration
// ═══════════════════════════════════════════════════════

interface DeptConfig {
  code: string;
  fullName: string;
  sections: string[];
  baseBatch: number;  // batch number for year-code 25 (2nd year)
}

const DEPARTMENTS: DeptConfig[] = [
  { code: 'AERO', fullName: 'Aeronautical Engineering', sections: ['A'], baseBatch: 30 },
  { code: 'AGRI', fullName: 'Agriculture Engineering', sections: ['A', 'B'], baseBatch: 35 },
  { code: 'AIDS', fullName: 'Artificial Intelligence and Data Science', sections: ['A', 'B', 'C'], baseBatch: 5 },
  { code: 'BME',  fullName: 'Biomedical Engineering', sections: ['A'], baseBatch: 20 },
  { code: 'BT',   fullName: 'Biotechnology', sections: ['A'], baseBatch: 25 },
  { code: 'CSE',  fullName: 'Computer Science & Engineering', sections: ['A', 'B', 'C'], baseBatch: 59 },
  { code: 'AIML', fullName: 'Computer Science and Engineering (AIML)', sections: ['A'], baseBatch: 5 },
  { code: 'CSBS', fullName: 'Computer Science and Business Systems', sections: ['A', 'B'], baseBatch: 8 },
  { code: 'ECE',  fullName: 'Electronics & Communication Engineering', sections: ['A', 'B'], baseBatch: 55 },
  { code: 'EEE',  fullName: 'Electrical & Electronics Engineering', sections: ['A'], baseBatch: 50 },
  { code: 'VLSI', fullName: 'VLSI', sections: ['A'], baseBatch: 10 },
  { code: 'MECH', fullName: 'Mechanical Engineering', sections: ['A'], baseBatch: 59 },
];

// Year codes and their academic year
const YEAR_BATCHES = [
  { yearCode: 26, academicYear: 1 },  // 1st year (juniors)
  { yearCode: 25, academicYear: 2 },  // 2nd year (current)
  { yearCode: 24, academicYear: 3 },  // 3rd year (senior 1)
  { yearCode: 23, academicYear: 4 },  // 4th year (senior 2)
];

// ═══════════════════════════════════════════════════════
// Indian Name Generator
// ═══════════════════════════════════════════════════════

const FIRST_NAMES = [
  'Aarav', 'Aditi', 'Aditya', 'Akash', 'Amara', 'Amith', 'Ananya', 'Anisha',
  'Anjali', 'Ankit', 'Arjun', 'Aryan', 'Bhavya', 'Charvi', 'Daksh', 'Deepa',
  'Deepak', 'Devi', 'Dhruv', 'Divya', 'Esha', 'Gagan', 'Gayathri', 'Gopal',
  'Hari', 'Harini', 'Harsha', 'Ishaan', 'Ishita', 'Jaya', 'Karan', 'Kavya',
  'Keerthi', 'Krishna', 'Lakshmi', 'Lavanya', 'Madhav', 'Manasa', 'Manoj',
  'Meera', 'Mohan', 'Mounika', 'Nandini', 'Naveen', 'Neha', 'Nikhil', 'Nisha',
  'Pooja', 'Prabhav', 'Pranav', 'Priya', 'Rahul', 'Rajan', 'Rajesh', 'Rakesh',
  'Ramya', 'Ravi', 'Revanth', 'Rithika', 'Rohit', 'Sahana', 'Sai', 'Sakshi',
  'Sandeep', 'Sanjay', 'Saravanan', 'Sathya', 'Shankar', 'Shreya', 'Siddharth',
  'Sneha', 'Sowmya', 'Srinivas', 'Suresh', 'Swathi', 'Tanvi', 'Teja', 'Uma',
  'Varun', 'Vignesh', 'Vijay', 'Vinay', 'Vishnu', 'Yamini', 'Yuvaraj', 'Abhinav',
  'Akshay', 'Bala', 'Chandru', 'Dharani', 'Elango', 'Fathima', 'Ganesh', 'Hema',
  'Indu', 'Jayashree', 'Kavin', 'Logesh', 'Mani', 'Nandhini', 'Oviya', 'Pavan',
  'Ranjith', 'Saranya', 'Thiru', 'Usha', 'Vasanth', 'Yamuna', 'Zara', 'Ashwin',
  'Bharathi', 'Chitra', 'Dinesh', 'Ezhil', 'Gokul', 'Haripriya', 'Ilayaraja',
  'Janani', 'Kiruthika', 'Latha', 'Muthu', 'Nithya', 'Parthiban', 'Ramesh',
  'Selvam', 'Tamizh', 'Velu', 'Arjunan', 'Bhuvan', 'Dhanush', 'Guru', 'Iniya',
  'Karthik', 'Madhan', 'Niranjan', 'Pavithra', 'Ragul', 'Sudhir', 'Tharun',
  'Venkat', 'Aishwarya', 'Balaji', 'Chirag', 'Darshini', 'Eshwar', 'Faisal',
  'Goutham', 'Harikrishnan', 'Jeevan', 'Keerthana', 'Lokesh', 'Mithun',
  'Naveena', 'Pradeep', 'Santhosh', 'Tamilselvan', 'Vikram',
];

const LAST_NAMES = [
  'Kumar', 'Sharma', 'Raj', 'Rajan', 'Pillai', 'Nair', 'Menon', 'Reddy',
  'Patel', 'Singh', 'Iyer', 'Iyengar', 'Naidu', 'Rao', 'Murthy', 'Krishnan',
  'Subramanian', 'Venkatesh', 'Gupta', 'Jain', 'Agarwal', 'Mishra', 'Pandey',
  'Tiwari', 'Yadav', 'Verma', 'Chauhan', 'Bhatt', 'Shah', 'Desai',
  'Selvam', 'Murugan', 'Arumugam', 'Bhaskar', 'Durai', 'Eswaran', 'Ganesh',
  'Hariharan', 'Jayaraman', 'Kannan', 'Lakshmanan', 'Muthusamy', 'Natarajan',
  'Palani', 'Raghavan', 'Sakthivel', 'Thangaraj', 'Velmurugan', 'Anand',
  'Babu', 'Chandran', 'Devaraj', 'Govindaraj', 'Ilango', 'Jeganathan',
  'Kathiresan', 'Logeshwaran', 'Manikandan', 'Pandian', 'Rajendran',
  'Senthilkumar', 'Thirunavukkarasu', 'Vasudevan', 'Aravind', 'Balakrishnan',
];

// ═══════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════

function randomPick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function padRoll(n: number): string {
  return String(n).padStart(3, '0');
}

function generateRegNo(
  yearCode: number,
  deptCode: string,
  batchNum: number,
  section: string,
  rollNum: number,
  isLateral: boolean
): string {
  // Format: YEAR + DEPT + BATCH + SECTION + (L if lateral) + ROLL
  const lateralMarker = isLateral ? 'L' : '';
  return `${yearCode}${deptCode}${batchNum}${section}${lateralMarker}${padRoll(rollNum)}`;
}

// ═══════════════════════════════════════════════════════
// User Generation
// ═══════════════════════════════════════════════════════

interface UserDoc {
  name: string;
  email: string;
  registrationNumber: string;
  password: string;
  userType: 'dayscholar' | 'hosteller';
  isAdmin: boolean;
  department: string;
  year: number;
  walletBalance: number;
  collegePoints: number;
  notifications: never[];
  walletTransactions: never[];
  savedCombos: never[];
  totalSpent: number;
  totalOrders: number;
}

async function generateAllUsers(): Promise<UserDoc[]> {
  const users: UserDoc[] = [];
  const usedNames = new Set<string>();

  const studentsPerSection = 10; // Regular students per section
  const lateralPerSection = 3;   // Lateral students per applicable section

  for (const dept of DEPARTMENTS) {
    for (const batch of YEAR_BATCHES) {
      // Calculate batch number for this year
      // baseBatch is for yearCode 25. Each older year decrements, newer increments.
      const batchNum = dept.baseBatch + (batch.yearCode - 25);

      // Skip if batch number would be <= 0 (dept didn't exist yet)
      if (batchNum <= 0) continue;

      for (const section of dept.sections) {
        // --- Regular students ---
        for (let roll = 1; roll <= studentsPerSection; roll++) {
          const regNo = generateRegNo(batch.yearCode, dept.code, batchNum, section, roll, false);
          const hashedPassword = await bcrypt.hash(regNo, 10);

          let firstName: string, lastName: string, fullName: string;
          do {
            firstName = randomPick(FIRST_NAMES);
            lastName = randomPick(LAST_NAMES);
            fullName = `${firstName} ${lastName}`;
          } while (usedNames.has(fullName));
          usedNames.add(fullName);

          const emailName = `${firstName.toLowerCase()}.${lastName.toLowerCase()}.${regNo.toLowerCase()}`;
          const email = `${emailName}@gmail.com`;

          const userType: 'dayscholar' | 'hosteller' = Math.random() < 0.7 ? 'dayscholar' : 'hosteller';
          const walletBalance = Math.round((Math.random() * 4500 + 500) * 100) / 100;

          users.push({
            name: fullName,
            email,
            registrationNumber: regNo,
            password: hashedPassword,
            userType,
            isAdmin: false,
            department: dept.fullName,
            year: batch.academicYear,
            walletBalance,
            collegePoints: Math.floor(Math.random() * 200),
            notifications: [],
            walletTransactions: [],
            savedCombos: [],
            totalSpent: 0,
            totalOrders: 0,
          });
        }

        // --- Lateral entry students (only for 2nd, 3rd, 4th year) ---
        if (batch.academicYear >= 2) {
          for (let roll = 1; roll <= lateralPerSection; roll++) {
            const regNo = generateRegNo(batch.yearCode, dept.code, batchNum, section, roll, true);
            const hashedPassword = await bcrypt.hash(regNo, 10);

            let firstName: string, lastName: string, fullName: string;
            do {
              firstName = randomPick(FIRST_NAMES);
              lastName = randomPick(LAST_NAMES);
              fullName = `${firstName} ${lastName}`;
            } while (usedNames.has(fullName));
            usedNames.add(fullName);

            const emailName = `${firstName.toLowerCase()}.${lastName.toLowerCase()}.${regNo.toLowerCase()}`;
            const email = `${emailName}@gmail.com`;

            const userType: 'dayscholar' | 'hosteller' = Math.random() < 0.7 ? 'dayscholar' : 'hosteller';
            const walletBalance = Math.round((Math.random() * 4500 + 500) * 100) / 100;

            users.push({
              name: fullName,
              email,
              registrationNumber: regNo,
              password: hashedPassword,
              userType,
              isAdmin: false,
              department: dept.fullName,
              year: batch.academicYear,
              walletBalance,
              collegePoints: Math.floor(Math.random() * 200),
              notifications: [],
              walletTransactions: [],
              savedCombos: [],
              totalSpent: 0,
              totalOrders: 0,
            });
          }
        }
      }
    }
  }

  return users;
}

// ═══════════════════════════════════════════════════════
// Main Seed Runner
// ═══════════════════════════════════════════════════════

async function seedStudents() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Get the raw collection (bypass Mongoose hooks for speed)
    const usersCollection = mongoose.connection.collection('users');

    // Check existing user count
    const existingCount = await usersCollection.countDocuments({ isAdmin: false });
    console.log(`📊 Existing non-admin users: ${existingCount}`);

    console.log('⚙️  Generating student data...');
    const users = await generateAllUsers();
    console.log(`📋 Generated ${users.length} student records`);

    // Get existing registration numbers to avoid duplicates
    const existingRegNos = await usersCollection
      .find({ registrationNumber: { $exists: true } }, { projection: { registrationNumber: 1 } })
      .toArray();
    const existingSet = new Set(existingRegNos.map(u => u.registrationNumber));

    // Filter out already existing users
    const newUsers = users.filter(u => !existingSet.has(u.registrationNumber));
    const skipped = users.length - newUsers.length;

    if (newUsers.length === 0) {
      console.log('⚠️  All users already exist. Nothing to insert.');
    } else {
      // Batch insert (bypass pre-save hook since password is already hashed)
      const BATCH_SIZE = 100;
      let inserted = 0;

      for (let i = 0; i < newUsers.length; i += BATCH_SIZE) {
        const batch = newUsers.slice(i, i + BATCH_SIZE);
        const result = await usersCollection.insertMany(batch, { ordered: false });
        inserted += result.insertedCount;
        console.log(`   ✅ Inserted batch ${Math.floor(i / BATCH_SIZE) + 1}: ${result.insertedCount} users`);
      }

      console.log('');
      console.log('═══════════════════════════════════════');
      console.log('📊 SEED SUMMARY');
      console.log('═══════════════════════════════════════');
      console.log(`   Generated:  ${users.length}`);
      console.log(`   Inserted:   ${inserted}`);
      console.log(`   Skipped:    ${skipped} (already existed)`);
    }

    // Final count
    const finalCount = await usersCollection.countDocuments({ isAdmin: false });
    console.log(`   Total users: ${finalCount}`);

    // Department distribution
    console.log('');
    console.log('📋 Department Distribution:');
    const deptAgg = await usersCollection
      .aggregate([
        { $match: { isAdmin: false } },
        { $group: { _id: '$department', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ])
      .toArray();

    for (const dept of deptAgg) {
      console.log(`   ${dept._id}: ${dept.count}`);
    }

    // Year distribution
    console.log('');
    console.log('📋 Year Distribution:');
    const yearAgg = await usersCollection
      .aggregate([
        { $match: { isAdmin: false } },
        { $group: { _id: '$year', count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ])
      .toArray();

    for (const yr of yearAgg) {
      console.log(`   Year ${yr._id}: ${yr.count}`);
    }

    // Sample registration numbers
    console.log('');
    console.log('📋 Sample Registration Numbers:');
    const samples = await usersCollection
      .find({ isAdmin: false })
      .project({ name: 1, registrationNumber: 1, department: 1, year: 1 })
      .limit(10)
      .sort({ registrationNumber: 1 })
      .toArray();

    for (const s of samples) {
      console.log(`   ${s.registrationNumber} → ${s.name} (${s.department}, Year ${s.year})`);
    }

  } catch (error) {
    console.error('❌ Seed Error:', error);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
    console.log('');
    console.log('🔌 Disconnected from MongoDB');
  }
}

seedStudents();
