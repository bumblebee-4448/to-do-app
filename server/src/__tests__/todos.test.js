const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const request = require('supertest');

const app = require('../app');
const Todo = require('../models/Todo');

let mongoServer;

const createTodo = (overrides = {}) =>
  Todo.create({
    title: 'Plan the week',
    description: 'Review active work and choose the next useful step.',
    priority: 'low',
    status: 'pending',
    dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
    ...overrides,
  });

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  await Todo.deleteMany({});
});

describe('Todo API', () => {
  test('lists todos with pagination metadata', async () => {
    await createTodo({ title: 'First task' });
    await createTodo({ title: 'Second task' });
    await createTodo({ title: 'Third task' });

    const res = await request(app).get('/api/v1/todos?page=1&limit=2');

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      success: true,
      pagination: {
        page: 1,
        limit: 2,
        total: 3,
        totalPages: 2,
        hasNextPage: true,
        hasPrevPage: false,
      },
    });
    expect(res.body.data).toHaveLength(2);
  });

  test('searches todos by title or description', async () => {
    await createTodo({ title: 'Write React tests', description: 'Cover UI flow' });
    await createTodo({ title: 'Buy groceries', description: 'Milk and bread' });

    const res = await request(app).get('/api/v1/todos?search=react');

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].title).toBe('Write React tests');
  });

  test('filters todos by status', async () => {
    await createTodo({ title: 'Pending task', status: 'pending' });
    await createTodo({ title: 'Completed task', status: 'completed' });

    const res = await request(app).get('/api/v1/todos?status=completed');

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].status).toBe('completed');
  });

  test('creates a todo with valid data', async () => {
    const res = await request(app)
      .post('/api/v1/todos')
      .send({
        title: 'Study React Query',
        description: 'Learn optimistic update rollback.',
        priority: 'medium',
        dueDate: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
      });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      success: true,
      data: {
        title: 'Study React Query',
        description: 'Learn optimistic update rollback.',
        priority: 'medium',
        status: 'pending',
      },
    });
  });

  test('rejects invalid todo creation data', async () => {
    const res = await request(app)
      .post('/api/v1/todos')
      .send({
        title: 'No',
        priority: 'urgent',
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Validation failed');
    expect(res.body.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ path: 'title' }),
        expect.objectContaining({ path: 'priority' }),
      ]),
    );
  });

  test('gets one todo and returns 404 for a missing todo', async () => {
    const todo = await createTodo({ title: 'Inspect one task' });
    const found = await request(app).get(`/api/v1/todos/${todo._id}`);
    const missingId = new mongoose.Types.ObjectId();
    const missing = await request(app).get(`/api/v1/todos/${missingId}`);

    expect(found.status).toBe(200);
    expect(found.body.data.title).toBe('Inspect one task');
    expect(missing.status).toBe(404);
    expect(missing.body).toMatchObject({
      success: false,
      message: 'Todo not found',
    });
  });

  test('updates a todo with PUT', async () => {
    const todo = await createTodo({ title: 'Original task' });

    const res = await request(app)
      .put(`/api/v1/todos/${todo._id}`)
      .send({
        title: 'Updated task',
        description: 'Updated description',
        priority: 'high',
        status: 'completed',
        dueDate: new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString(),
      });

    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({
      title: 'Updated task',
      description: 'Updated description',
      priority: 'high',
      status: 'completed',
    });
  });

  test('patches a todo status', async () => {
    const todo = await createTodo({ title: 'Toggle me', status: 'pending' });

    const res = await request(app)
      .patch(`/api/v1/todos/${todo._id}`)
      .send({ status: 'completed' });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('completed');
  });

  test('deletes a todo with no content response', async () => {
    const todo = await createTodo({ title: 'Remove me' });

    const res = await request(app).delete(`/api/v1/todos/${todo._id}`);
    const stored = await Todo.findById(todo._id);

    expect(res.status).toBe(204);
    expect(res.text).toBe('');
    expect(stored).toBeNull();
  });
});
