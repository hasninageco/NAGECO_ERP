const { sequelize, Sequelize, DataTypes } = require('../models/insurance/_sequelize');
const ClaimActivityLog = require('../models/insurance/ClaimActivityLog');

let tableReadyPromise = null;

const ensureTable = async () => {
  if (tableReadyPromise) return tableReadyPromise;
  tableReadyPromise = (async () => {
    try {
      const qi = sequelize.getQueryInterface();
      await qi.describeTable('ClaimActivityLog');
      return true;
    } catch {
      try {
        const qi = sequelize.getQueryInterface();
        await qi.createTable('ClaimActivityLog', {
          ActivityId: {
            type: DataTypes.BIGINT,
            allowNull: false,
            primaryKey: true,
            autoIncrement: true,
          },
          ClaimId: {
            type: DataTypes.BIGINT,
            allowNull: false,
          },
          Action: {
            type: DataTypes.STRING(60),
            allowNull: false,
          },
          Actor: {
            type: DataTypes.TEXT,
            allowNull: true,
          },
          Meta: {
            type: DataTypes.TEXT,
            allowNull: true,
          },
          CreatedAt: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: Sequelize.literal('SYSDATETIME()'),
          },
        });
        return true;
      } catch {
        return false;
      }
    }
  })();

  return tableReadyPromise;
};

const normalizeActor = (user) => {
  if (!user) return null;
  if (typeof user === 'string') return { id: user };
  const out = {};
  // Common JWT fields in this project may vary
  if (user.id !== undefined) out.id = user.id;
  if (user.userId !== undefined) out.userId = user.userId;
  if (user.username !== undefined) out.username = user.username;
  if (user.name !== undefined) out.name = user.name;
  if (user.email !== undefined) out.email = user.email;
  if (!Object.keys(out).length) return { raw: user };
  return out;
};

// Append-only activity record in SQL Server (best-effort).
const appendClaimActivity = async ({ claimId, action, actor, meta }) => {
  try {
    if (!claimId) return;
    const ok = await ensureTable();
    if (!ok) return;

    const payload = {
      ClaimId: Number(claimId),
      Action: String(action || '').trim() || 'unknown',
      Actor: actor ? JSON.stringify(normalizeActor(actor)) : null,
      Meta: meta !== undefined ? JSON.stringify(meta && typeof meta === 'object' ? meta : { value: meta }) : null,
    };

    await ClaimActivityLog.create(payload);
  } catch {
    // swallow logging errors
  }
};

module.exports = {
  appendClaimActivity,
};
