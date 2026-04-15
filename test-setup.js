#!/usr/bin/env node

/**
 * Test script to verify Google Calendar API integration setup
 * Run with: node test-setup.js
 */

const fs = require('fs');
const path = require('path');

console.log('\n🧪 Testing Google Calendar API Setup\n');
console.log('=====================================\n');

let passed = 0;
let failed = 0;

// Test 1: Check if .env file exists
console.log('1️⃣  Checking .env file...');
if (fs.existsSync('.env')) {
    console.log('   ✓ .env file exists');
    passed++;
} else {
    console.log('   ✗ .env file not found (copy from .env.example)');
    failed++;
}

// Test 2: Check if node_modules exists
console.log('\n2️⃣  Checking dependencies...');
if (fs.existsSync('node_modules')) {
    console.log('   ✓ node_modules found');
    passed++;
} else {
    console.log('   ✗ node_modules not found (run: npm install)');
    failed++;
}

// Test 3: Check required files
console.log('\n3️⃣  Checking required files...');
const requiredFiles = [
    'src/server.js',
    'package.json',
    'public/js/calendar.js',
    'public/js/config.js',
    'public/availability.html',
    'public/data/availability.json'
];

requiredFiles.forEach(file => {
    if (fs.existsSync(file)) {
        console.log(`   ✓ ${file}`);
        passed++;
    } else {
        console.log(`   ✗ ${file} (missing)`);
        failed++;
    }
});

// Test 4: Check .env variables
console.log('\n4️⃣  Checking .env variables...');
if (fs.existsSync('.env')) {
    const envContent = fs.readFileSync('.env', 'utf8');
    const requiredVars = [
        'GOOGLE_CLIENT_ID',
        'GOOGLE_CLIENT_SECRET',
        'GOOGLE_REDIRECT_URL',
        'GOOGLE_ACCESS_TOKEN',
        'GOOGLE_REFRESH_TOKEN'
    ];

    let missingVars = [];
    requiredVars.forEach(varName => {
        if (envContent.includes(varName)) {
            const value = envContent.split(`${varName}=`)[1]?.split('\n')[0]?.trim();
            if (value && !value.includes('your_') && value !== '') {
                console.log(`   ✓ ${varName} (configured)`);
                passed++;
            } else {
                console.log(`   ✗ ${varName} (not configured - needs value)`);
                missingVars.push(varName);
                failed++;
            }
        } else {
            console.log(`   ✗ ${varName} (missing from .env)`);
            missingVars.push(varName);
            failed++;
        }
    });

    if (missingVars.length > 0) {
        console.log(`\n   ⚠️  Missing variables: ${missingVars.join(', ')}`);
        console.log('   See GOOGLE_CALENDAR_SETUP.md for instructions');
    }
} else {
    console.log('   ✗ Cannot check .env (file not found)');
    failed++;
}

// Test 5: Check Node.js version
console.log('\n5️⃣  Checking Node.js...');
const nodeVersion = process.version;
console.log(`   ✓ Node.js ${nodeVersion}`);
passed++;

// Test 6: Test import
console.log('\n6️⃣  Testing module imports...');
try {
    require('express');
    console.log('   ✓ express module found');
    passed++;
} catch (e) {
    console.log('   ✗ express module not found (run: npm install)');
    failed++;
}

try {
    require('googleapis');
    console.log('   ✓ googleapis module found');
    passed++;
} catch (e) {
    console.log('   ✗ googleapis module not found (run: npm install)');
    failed++;
}

// Summary
console.log('\n=====================================');
console.log(`\n📊 Results: ${passed} passed, ${failed} failed\n`);

if (failed === 0) {
    console.log('✅ All checks passed! You\'re ready to go.\n');
    console.log('Next step: npm start');
    console.log('Then visit: http://localhost:3000/auth/google\n');
    process.exit(0);
} else {
    console.log('⚠️  Fix the issues above before starting.\n');
    console.log('See GOOGLE_CALENDAR_SETUP.md for help.\n');
    process.exit(1);
}
