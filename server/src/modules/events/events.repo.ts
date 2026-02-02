import type mysql from 'mysql2/promise';
import { db } from '../../config/mysql';
import type { CreateEventDto } from './events.schema';

type FindEventsParams = {
  page: number;
  size: number;
  type?: string;
  level?: 'INFO' | 'WARN' | 'ERROR';
};

export const eventsRepo = {
  async insertEvent(dto: CreateEventDto): Promise<{ id: number }> {
    const occurredAt = dto.occurredAt ? new Date(dto.occurredAt) : null;

    const [result] = await db.execute<mysql.ResultSetHeader>(
      `
      INSERT INTO events (source, type, level, payload, occurred_at)
      VALUES (?, ?, ?, ?, ?)
      `,
      [
        dto.source,
        dto.type,
        dto.level,
        JSON.stringify(dto.payload ?? {}),
        occurredAt,
      ]
    );

    return { id: Number(result.insertId) };
  },

  async findEvents(params: FindEventsParams) {
    const safePage = Math.max(1, Math.floor(Number(params.page) || 1));
    const safeSize = Math.min(100, Math.max(1, Math.floor(Number(params.size) || 20)));
    const offset = (safePage - 1) * safeSize;

    const where: string[] = [];
    const values: any[] = [];

    if (params.type) {
      where.push('type = ?');
      values.push(params.type);
    }
    if (params.level) {
      where.push('level = ?');
      values.push(params.level);
    }

    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

    const listSql = `
      SELECT id, source, type, level, payload, occurred_at, created_at
      FROM events
      ${whereSql}
      ORDER BY id DESC
      LIMIT ${safeSize} OFFSET ${offset}
    `;

    const countSql = `
      SELECT COUNT(*) as total
      FROM events
      ${whereSql}
    `;

    const [rows] = await db.query(listSql, values);
    const [countRows] = await db.query(countSql, values);

    const total = Number((countRows as any[])[0]?.total ?? 0);

    return { items: rows as any[], total };
  },
};
