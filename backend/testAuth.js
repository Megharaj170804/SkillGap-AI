const axios = require('axios');

const test = async () => {
  try {
    console.log('Testing Registration...');
    const regRes = await axios.post('http://localhost:5000/api/auth/register', {
      name: 'Test Node',
      email: `test${Date.now()}@test.com`,
      password: 'password123'
    });
    console.log('Registration Success:', regRes.data);

    console.log('\nTesting Login...');
    const loginRes = await axios.post('http://localhost:5000/api/auth/login', {
      email: regRes.config.data ? JSON.parse(regRes.config.data).email : `test${Date.now()}@test.com`,
      password: 'password123'
    });
    console.log('Login Success:', loginRes.data);
  } catch (err) {
    if (err.response) {
      console.error('Error Response:', err.response.status, err.response.data);
    } else {
      console.error('Error:', err.message);
    }
  }
};

test();
