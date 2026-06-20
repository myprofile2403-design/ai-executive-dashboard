const baseUrl = 'http://localhost:3000';

async function runTests() {
  console.log('\x1b[36m%s\x1b[0m', '🚀 Starting API Integration and Validation Tests...');
  
  let createdEventIds = [];

  try {
    // ----------------------------------------------------
    // Test 1: Validation Testing (Invalid Request)
    // ----------------------------------------------------
    console.log('\n\x1b[33m%s\x1b[0m', 'Test 1: Validation testing (POST /api/events with invalid data)...');
    const invalidEvent = {
      type: 'invalid_type', // should be task, reminder, etc.
      title: '', // should be non-empty
      raw_text: 'Hello world'
    };

    const res1 = await fetch(`${baseUrl}/api/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(invalidEvent),
    });

    if (res1.status === 400) {
      const body = await res1.json();
      console.log('\x1b[32m%s\x1b[0m', '✔ Passed! Returned HTTP 400 Bad Request.');
      console.log('Error details:', JSON.stringify(body.details, null, 2));
    } else {
      throw new Error(`Expected HTTP 400, but got ${res1.status}`);
    }

    // ----------------------------------------------------
    // Test 2: Create Resources (POST /api/events)
    // ----------------------------------------------------
    console.log('\n\x1b[33m%s\x1b[0m', 'Test 2: Creating a mock task and expense...');
    const mockTask = {
      type: 'task',
      title: 'API Test Task',
      raw_text: 'Create a test task via Next.js REST API',
      status: 'open'
    };

    const res2 = await fetch(`${baseUrl}/api/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(mockTask),
    });

    if (res2.status !== 201) {
      throw new Error(`Expected HTTP 201 Created, but got ${res2.status}`);
    }

    const taskData = await res2.json();
    console.log('\x1b[32m%s\x1b[0m', '✔ Task created successfully!');
    console.log('Created Task ID:', taskData.data.id);
    createdEventIds.push(taskData.data.id);

    const mockExpense = {
      type: 'expense',
      title: 'API Test Fuel',
      raw_text: 'Spent 1200 CZK on fuel',
      amount: 1200,
      currency: 'CZK',
      project: 'топливо',
      status: 'done'
    };

    const res3 = await fetch(`${baseUrl}/api/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(mockExpense),
    });

    if (res3.status !== 201) {
      throw new Error(`Expected HTTP 201 Created, but got ${res3.status}`);
    }

    const expenseData = await res3.json();
    console.log('\x1b[32m%s\x1b[0m', '✔ Expense created successfully!');
    console.log('Created Expense ID:', expenseData.data.id);
    createdEventIds.push(expenseData.data.id);

    const mockWork = {
      type: 'work',
      title: 'API Test Work Hours',
      raw_text: 'Worked 4.5 hours on dashboard',
      amount: 4.5,
      project: 'Executive Assistant',
      status: 'done'
    };

    const resWork = await fetch(`${baseUrl}/api/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(mockWork),
    });

    if (resWork.status !== 201) {
      throw new Error(`Expected HTTP 201 Created, but got ${resWork.status}`);
    }

    const workData = await resWork.json();
    console.log('\x1b[32m%s\x1b[0m', '✔ Work hours event created successfully!');
    console.log('Created Work ID:', workData.data.id);
    createdEventIds.push(workData.data.id);

    // ----------------------------------------------------
    // Test 3: Read Resources (GET /api/events)
    // ----------------------------------------------------
    console.log('\n\x1b[33m%s\x1b[0m', 'Test 3: Querying events list (GET /api/events)...');
    const res4 = await fetch(`${baseUrl}/api/events?type=task`);
    if (res4.status !== 200) {
      throw new Error(`Expected HTTP 200 OK, but got ${res4.status}`);
    }
    const eventsList = await res4.json();
    const foundTask = eventsList.data.find(e => e.id === taskData.data.id);
    if (!foundTask) {
      throw new Error('Could not find the created task in the events list.');
    }
    console.log('\x1b[32m%s\x1b[0m', `✔ Found the mock task in events list (Title: "${foundTask.title}").`);

    // ----------------------------------------------------
    // Test 4: Query Stats (GET /api/stats)
    // ----------------------------------------------------
    console.log('\n\x1b[33m%s\x1b[0m', 'Test 4: Checking stats (GET /api/stats)...');
    const res5 = await fetch(`${baseUrl}/api/stats`);
    if (res5.status !== 200) {
      throw new Error(`Expected HTTP 200 OK, but got ${res5.status}`);
    }
    const statsData = await res5.json();
    console.log('Current Open Tasks Count:', statsData.openTasks);
    console.log("Today's Expenses Summary:", JSON.stringify(statsData.todayExpenses));
    console.log("Month's Work Hours:", statsData.monthWorkHours);
    if (statsData.openTasks < 1) {
      throw new Error('Expected at least 1 open task in statistics.');
    }
    if (typeof statsData.monthWorkHours !== 'number' || statsData.monthWorkHours < 4.5) {
      throw new Error(`Expected at least 4.5 hours of work in statistics, but got ${statsData.monthWorkHours}`);
    }
    console.log('\x1b[32m%s\x1b[0m', '✔ Stats reflect the newly created events.');

    // ----------------------------------------------------
    // Test 5: Update Status (PATCH /api/events)
    // ----------------------------------------------------
    console.log('\n\x1b[33m%s\x1b[0m', 'Test 5: Updating task status (PATCH /api/events)...');
    const res6 = await fetch(`${baseUrl}/api/events`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: taskData.data.id,
        status: 'in-progress'
      }),
    });

    if (res6.status !== 200) {
      throw new Error(`Expected HTTP 200 OK, but got ${res6.status}`);
    }
    const updatedTask = await res6.json();
    if (updatedTask.data.status !== 'in-progress') {
      throw new Error(`Expected status 'in-progress', but got '${updatedTask.data.status}'`);
    }
    console.log('\x1b[32m%s\x1b[0m', `✔ Task status successfully updated to: ${updatedTask.data.status}`);

    // ----------------------------------------------------
    // Test 6: Delete Resources (DELETE /api/events)
    // ----------------------------------------------------
    console.log('\n\x1b[33m%s\x1b[0m', 'Test 6: Cleaning up resources (DELETE /api/events)...');
    for (const id of createdEventIds) {
      const res7 = await fetch(`${baseUrl}/api/events?id=${id}`, {
        method: 'DELETE',
      });
      if (res7.status !== 204) {
        throw new Error(`Expected HTTP 204 No Content for deletion, but got ${res7.status}`);
      }
      console.log('\x1b[32m%s\x1b[0m', `✔ Deleted event: ${id}`);
    }
    createdEventIds = []; // cleared

    // Verify deletion
    const res8 = await fetch(`${baseUrl}/api/events`);
    const finalEvents = await res8.json();
    const remains = finalEvents.data.filter(e => createdEventIds.includes(e.id));
    if (remains.length > 0) {
      throw new Error('Some mock events were not deleted.');
    }
    console.log('\x1b[32m%s\x1b[0m', '✔ Cleaned up database successfully. No mock items remain.');

    console.log('\n\x1b[32;1m%s\x1b[0m', '🎉 All API integration and validation tests passed successfully!');

  } catch (error) {
    console.error('\n\x1b[31;1m%s\x1b[0m', '❌ API Tests Failed!');
    console.error(error);
    
    // Attempt cleanup if failed midway
    if (createdEventIds.length > 0) {
      console.log('\x1b[33m%s\x1b[0m', 'Cleaning up created mock events due to test failure...');
      for (const id of createdEventIds) {
        await fetch(`${baseUrl}/api/events?id=${id}`, { method: 'DELETE' }).catch(() => {});
      }
    }
    process.exit(1);
  }
}

runTests();
