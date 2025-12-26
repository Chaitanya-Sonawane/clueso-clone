const axios = require('axios');

const BASE_URL = 'http://localhost:3001';

async function testRegistrationFlow() {
    console.log('🧪 Testing Registration Flow...\n');

    try {
        // Test 1: Register a new user
        console.log('1️⃣ Testing user registration...');
        const timestamp = Date.now();
        const testUser = {
            fullName: 'Test Registration User',
            email: `regtest${timestamp}@example.com`,
            password: 'testpass123'
        };

        const registerResponse = await axios.post(`${BASE_URL}/api/auth/register`, testUser);
        
        if (registerResponse.data.success) {
            console.log('✅ Registration successful!');
            console.log(`   User ID: ${registerResponse.data.data.user.id}`);
            console.log(`   Email: ${registerResponse.data.data.user.email}`);
            console.log(`   Username: ${registerResponse.data.data.user.username}`);
            console.log(`   Token: ${registerResponse.data.data.token.substring(0, 20)}...`);
        } else {
            console.log('❌ Registration failed:', registerResponse.data.message);
            return;
        }

        // Test 2: Login with the same user
        console.log('\n2️⃣ Testing user login...');
        const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
            email: testUser.email,
            password: testUser.password
        });

        if (loginResponse.data.success) {
            console.log('✅ Login successful!');
            console.log(`   User ID: ${loginResponse.data.data.user.id}`);
            console.log(`   Last Login: ${loginResponse.data.data.user.last_login}`);
        } else {
            console.log('❌ Login failed:', loginResponse.data.message);
        }

        // Test 3: Test duplicate email registration
        console.log('\n3️⃣ Testing duplicate email registration...');
        try {
            await axios.post(`${BASE_URL}/api/auth/register`, testUser);
            console.log('❌ Duplicate registration should have failed!');
        } catch (error) {
            if (error.response && error.response.data.message.includes('already exists')) {
                console.log('✅ Duplicate email properly rejected!');
            } else {
                console.log('❌ Unexpected error:', error.response?.data?.message || error.message);
            }
        }

        // Test 4: Test username uniqueness
        console.log('\n4️⃣ Testing username uniqueness...');
        const anotherUser = {
            fullName: 'Another Test User',
            email: `regtest${timestamp + 1}@example.com`,
            password: 'testpass123'
        };

        const anotherRegResponse = await axios.post(`${BASE_URL}/api/auth/register`, anotherUser);
        
        if (anotherRegResponse.data.success) {
            console.log('✅ Second user registered with unique username!');
            console.log(`   Username: ${anotherRegResponse.data.data.user.username}`);
            
            // Check if usernames are different
            if (registerResponse.data.data.user.username !== anotherRegResponse.data.data.user.username) {
                console.log('✅ Usernames are properly unique!');
            } else {
                console.log('❌ Usernames should be different!');
            }
        }

        console.log('\n🎉 All tests completed successfully!');

    } catch (error) {
        console.error('❌ Test failed:', error.response?.data?.message || error.message);
    }
}

// Run the test
testRegistrationFlow();