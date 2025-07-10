import React, { useState, useEffect } from 'react';
import BASE_URL from '../config';

const APITestPage = () => {
  const [testResults, setTestResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const endpoints = [
    { name: 'Slots', url: '/api/slots/', method: 'GET' },
    { name: 'Reservations', url: '/api/reservations/', method: 'GET' },
    { name: 'Users', url: '/api/users/', method: 'GET' },
    { name: 'Settings', url: '/api/settings/', method: 'GET' },
    { name: 'Parking Rates', url: '/api/parking-rates/', method: 'GET' },
    { name: 'Available Slots', url: '/api/available-slots/', method: 'GET' },
    { name: 'OTP Send', url: '/api/otp/send/', method: 'POST', body: { phone_number: '09123456789' } },
  ];

  const testEndpoint = async (endpoint) => {
    try {
      const options = {
        method: endpoint.method,
        headers: {
          'Content-Type': 'application/json',
        },
      };

      if (endpoint.body) {
        options.body = JSON.stringify(endpoint.body);
      }

      const response = await fetch(`${BASE_URL}${endpoint.url}`, options);
      const data = await response.json();

      return {
        name: endpoint.name,
        url: endpoint.url,
        status: response.status,
        success: response.ok,
        data: Array.isArray(data) ? `Array[${data.length}]` : JSON.stringify(data).substring(0, 100),
        error: null,
      };
    } catch (error) {
      return {
        name: endpoint.name,
        url: endpoint.url,
        status: 'ERROR',
        success: false,
        data: null,
        error: error.message,
      };
    }
  };

  const runAllTests = async () => {
    setIsLoading(true);
    setTestResults([]);

    const results = [];
    for (const endpoint of endpoints) {
      const result = await testEndpoint(endpoint);
      results.push(result);
      setTestResults([...results]); // Update UI progressively
    }

    setIsLoading(false);
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    runAllTests();
  }, []);

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>API Connectivity Test</h1>
      <p><strong>Backend URL:</strong> {BASE_URL}</p>
      
      <button 
        onClick={runAllTests} 
        disabled={isLoading}
        style={{ 
          padding: '10px 20px', 
          marginBottom: '20px',
          backgroundColor: '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: isLoading ? 'not-allowed' : 'pointer'
        }}
      >
        {isLoading ? 'Testing...' : 'Run Tests'}
      </button>

      <div>
        {testResults.map((result, index) => (
          <div 
            key={index}
            style={{
              border: '1px solid #ddd',
              margin: '10px 0',
              padding: '15px',
              borderRadius: '5px',
              backgroundColor: result.success ? '#d4edda' : '#f8d7da',
            }}
          >
            <h3 style={{ margin: '0 0 10px 0' }}>
              {result.name} - {result.url}
            </h3>
            <p><strong>Status:</strong> {result.status}</p>
            <p><strong>Success:</strong> {result.success ? 'Yes' : 'No'}</p>
            {result.error && <p><strong>Error:</strong> {result.error}</p>}
            {result.data && <p><strong>Data:</strong> {result.data}</p>}
          </div>
        ))}
      </div>

      {isLoading && (
        <div style={{ textAlign: 'center', marginTop: '20px' }}>
          <p>Testing API endpoints...</p>
        </div>
      )}
    </div>
  );
};

export default APITestPage;
