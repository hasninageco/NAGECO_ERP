
const employee = require("../models/employee");

const Sequelize = require('sequelize')


var Op = Sequelize.Op


exports.find = (req, res) => {





    try {

        employee
            .findAll({


               order: [[Sequelize.cast(Sequelize.col('ref_emp'), 'BIGINT'), "ASC"]],


                where: {
                    [Op.and]: [
                        { Ref_emp: { [Op.ne]: 0 } },

                        { STATE: true }
                    ]
                },
 
            })
            .then((data) => {

                res.json(data);


            })
            .catch((err) => {
                res.status(500).json("NOTexist");
            });


    }
    catch (e) {
        res.json(e + "  /fail")
    }


};