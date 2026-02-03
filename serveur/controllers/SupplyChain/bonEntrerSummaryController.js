const { Op, fn, col, literal } = require('sequelize');
const BonEntrer = require('../../models/SupplyCahin/Bon_entrer');
const BonSortie = require('../../models/SupplyCahin/Bon_sortie');
const Article = require('../../models/SupplyCahin/Product');
const Currency = require('../../models/fin/Currency');

// GET /bonentrer/summary
// Returns: {
//   count: number (products count from Article),
//   totalByCurrency: { [name_c]: number } where number = SUM(price_bn * qty) for that currency,
//   totalLYD: number (SUM(price_bn * qty) for entries with currency name 'LYD')
// }
exports.getSummary = async (req, res) => {
  try {
    const sequelize = BonEntrer.sequelize;

    // Ensure associations exist for include
    if (!BonEntrer.associations.Article) {
      BonEntrer.belongsTo(Article, { foreignKey: 'id_art', targetKey: 'Id_art' });
    }
    if (!BonEntrer.associations.curr) {
      BonEntrer.belongsTo(Currency, { as: 'curr', foreignKey: 'CURRENCY', targetKey: 'INt_c' });
    }

    // Count of products (normal count from Article table)
    const count = await Article.count();

    // Batch-level aggregation by (id_art, EXPIRE_DATE, currency) to compute net qty and value using MAX(price_bn)
    const rows = await BonEntrer.findAll({
      attributes: [
        [col('curr.name_c'), 'currency'],
        [col('Bon_entrer.id_art'), 'id_art'],
        [col('Bon_entrer.EXPIRE_DATE'), 'expire_date'],
        [fn('MAX', col('Bon_entrer.price_bn')), 'max_price'],
        [fn('SUM', col('Bon_entrer.qty')), 'qty_in'],
        [
          literal(`COALESCE((
            SELECT SUM(bs.qty)
            FROM Bon_sortie bs
            WHERE bs.id_art = Bon_entrer.id_art AND bs.Expire_date = Bon_entrer.EXPIRE_DATE
          ), 0)`),
          'qty_out'
        ]
      ],
      include: [
        { model: Article, attributes: [] },
        { model: Currency, attributes: [], as: 'curr', required: false }
      ],
      where: {
        '$Article.ID_SECTION$': 2,
        [Op.and]: [
          sequelize.where(
            literal(`(
              SELECT COALESCE(SUM(ent.qty), 0)
              FROM Bon_entrer ent
              WHERE ent.id_art = Bon_entrer.id_art AND ent.EXPIRE_DATE = Bon_entrer.EXPIRE_DATE
            ) - (
              SELECT COALESCE(SUM(bs.qty), 0)
              FROM Bon_sortie bs
              WHERE bs.id_art = Bon_entrer.id_art AND bs.Expire_date = Bon_entrer.EXPIRE_DATE
            )`),
            { [Op.gt]: 0 }
          )
        ]
      },
      group: [col('curr.name_c'), col('Bon_entrer.id_art'), col('Bon_entrer.EXPIRE_DATE')],
      raw: true
    });

    // Reduce to totals by currency using: MAX(price_bn) * (qty_in - qty_out)
    const totalByCurrency = {};
    let totalLYD = 0;
    for (const r of rows) {
      const key = r.currency || 'Unknown';
      const maxPrice = parseFloat(r.max_price) || 0;
      const qtyIn = parseFloat(r.qty_in) || 0;
      const qtyOut = parseFloat(r.qty_out) || 0;
      const netQty = Math.max(qtyIn - qtyOut, 0);
      const value = maxPrice * netQty;
      totalByCurrency[key] = (totalByCurrency[key] || 0) + value;
      if (key === 'LYD') totalLYD += value;
    }

    res.json({ count, totalByCurrency, totalLYD });
  } catch (err) {
    res.status(500).json({ message: err.message || 'Failed to build summary' });
  }
};
