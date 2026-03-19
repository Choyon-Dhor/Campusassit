const axios = require('axios');

(async () => {
  try {
    const login = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'admin@campus.edu',
      password: 'password123',
    });
    console.log('LOGIN', login.data);

    const token = login.data.token;
    const batches = await axios.get('http://localhost:5000/api/batch-routine/batches', {
      headers: { Authorization: 'Bearer ' + token },
    });
    console.log('BATCHES', JSON.stringify(batches.data, null, 2));
  } catch (err) {
    console.error('ERROR', err.response ? err.response.data : err.message);
  }
})();
