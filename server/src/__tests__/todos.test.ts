import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';
import app from '../app';
import Todo, { type TodoStatus } from '../models/Todo';

type TodoOverrides = Partial<{
  title: string;
  description: string;
  status: TodoStatus;
  dueDate: Date;
  position: number;
}>;

let mongoServer: MongoMemoryServer;

const createTodo = (overrides: TodoOverrides = {}) =>
  Todo.create({
    title: 'Plan the week',
    description: 'Review active work and choose the next useful step.',
    status: 'incomplete',
    dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
    ...overrides,
  });

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create({
    binary: {
      version: '7.0.24',
    },
  });
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
    await createTodo({ title: 'Pending task', status: 'incomplete' });
    await createTodo({ title: 'Completed task', status: 'completed' });

    const res = await request(app).get('/api/v1/todos?status=completed');

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].status).toBe('completed');
  });

  test('lists board todos by status with position sorting and pagination metadata', async () => {
    await createTodo({ title: 'Pending one', status: 'pending', position: 2000 });
    await createTodo({ title: 'Pending two', status: 'pending', position: 1000 });
    await createTodo({ title: 'Done one', status: 'completed', position: 1000 });

    const res = await request(app).get('/api/v1/todos?status=pending&page=1&limit=1&sortBy=position&order=asc');

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].title).toBe('Pending two');
    expect(res.body.pagination.total).toBe(2);
    expect(res.body.pagination.totalPages).toBe(2);
  });

  test('creates a todo with valid data', async () => {
    const res = await request(app)
      .post('/api/v1/todos')
      .send({
        title: 'Study React Query',
        description: 'Learn optimistic update rollback.',
        dueDate: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
      });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      success: true,
      data: {
        title: 'Study React Query',
        description: 'Learn optimistic update rollback.',
        status: 'pending',
      },
    });
  });

  test('rejects invalid todo creation data', async () => {
    const res = await request(app)
      .post('/api/v1/todos')
      .send({
        title: 'No',
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Validation failed');
    expect(res.body.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ path: 'title' }),
      ]),
    );
  });

  test('rejects invalid status and dueDate during creation', async () => {
    const res = await request(app)
      .post('/api/v1/todos')
      .send({
        title: 'Valid title',
        status: 'archived',
        dueDate: 'not-a-date',
      });

    expect(res.status).toBe(400);
    expect(res.body.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ path: 'status', location: 'body' }),
        expect.objectContaining({ path: 'dueDate', location: 'body' }),
      ]),
    );
  });

  test('accepts valid status and dueDate during creation', async () => {
    const res = await request(app)
      .post('/api/v1/todos')
      .send({
        title: 'Create in done column',
        status: 'completed',
        dueDate: new Date(Date.now() + 86_400_000).toISOString(),
      });

    expect(res.status).toBe(201);
    expect(res.body.data.status).toBe('completed');
    expect(res.body.data.dueDate).toBeTruthy();
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

  test('updates a todo with PATCH', async () => {
    const todo = await createTodo({ title: 'Original task' });

    const res = await request(app)
      .patch(`/api/v1/todos/${todo._id}`)
      .send({
        title: 'Updated task',
        description: 'Updated description',
        status: 'completed',
        dueDate: new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString(),
      });

    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({
      title: 'Updated task',
      description: 'Updated description',
      status: 'completed',
    });
  });

  test('patches a todo status', async () => {
    const todo = await createTodo({ title: 'Toggle me', status: 'incomplete' });

    const res = await request(app)
      .patch(`/api/v1/todos/${todo._id}`)
      .send({ status: 'completed' });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('completed');
  });

  test('moves a todo to a column and persists a position between neighbors', async () => {
    const first = await createTodo({ title: 'First pending', status: 'pending', position: 1000 });
    const second = await createTodo({ title: 'Second pending', status: 'pending', position: 2000 });
    const moving = await createTodo({ title: 'Move me', status: 'incomplete', position: 1000 });

    const res = await request(app)
      .patch(`/api/v1/todos/${moving._id}/move`)
      .send({
        status: 'pending',
        beforeId: String(second._id),
        afterId: String(first._id),
      });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('pending');
    expect(res.body.data.position).toBeGreaterThan(first.position);
    expect(res.body.data.position).toBeLessThan(second.position);
  });

  test('deletes a todo with no content response (soft delete)', async () => {
    const todo = await createTodo({ title: 'Remove me' });

    const res = await request(app).delete(`/api/v1/todos/${todo._id}`);
    const stored = await Todo.findById(todo._id);

    expect(res.status).toBe(204);
    expect(res.text).toBe('');
    expect(stored).not.toBeNull();
    expect(stored?.isDeleted).toBe(true);
    expect(stored?.deletedAt).toBeInstanceOf(Date);
  });

  test('does not patch a soft-deleted todo', async () => {
    const todo = await createTodo({ title: 'Already deleted' });
    await Todo.findByIdAndUpdate(todo._id, {
      isDeleted: true,
      deletedAt: new Date(),
    });

    const res = await request(app)
      .patch(`/api/v1/todos/${todo._id}`)
      .send({ title: 'Should not update' });

    expect(res.status).toBe(404);
    const stored = await Todo.findById(todo._id);
    expect(stored?.title).toBe('Already deleted');
  });

  test('delete returns 404 for an already soft-deleted todo', async () => {
    const todo = await createTodo({ title: 'Delete once' });
    await request(app).delete(`/api/v1/todos/${todo._id}`);

    const secondDelete = await request(app).delete(`/api/v1/todos/${todo._id}`);

    expect(secondDelete.status).toBe(404);
  });

  test('patch and delete do not use unfiltered id-only updates', async () => {
    const first = await createTodo({ title: 'Patch atomically' });
    const second = await createTodo({ title: 'Delete atomically' });
    const idOnlyUpdateSpy = jest.spyOn(Todo, 'findByIdAndUpdate');

    try {
      await request(app)
        .patch(`/api/v1/todos/${first._id}`)
        .send({ title: 'Patched atomically' });
      await request(app).delete(`/api/v1/todos/${second._id}`);

      expect(idOnlyUpdateSpy).not.toHaveBeenCalled();
    } finally {
      idOnlyUpdateSpy.mockRestore();
    }
  });
});
