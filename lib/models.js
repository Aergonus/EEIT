var Sequelize     = require('sequelize') // MySQL ORM 
  , SequelizeAuto = require('sequelize-auto') // MySQL Auto Model Generator
  , path          = require('path') // Core Node module for working with and handling paths
  , config        = require(path.join(__dirname, 'config')) // Hides secret configuration info
  , sequelize     = new Sequelize(config.seq.database, config.seq.username, config.seq.password, config.seq.options)
  , auto          = new SequelizeAuto(config.auto.database, config.auto.username, config.auto.password, config.auto.options)
  ;
/*
auto.run(function (err) {
  if (err) throw err;

  //console.log(auto.tables); // table list
  //console.log(auto.foreignKeys); // foreign key list
});
*/

/**
 * Our User model.
 *
 * This is how we create, edit, delete, and retrieve user accounts via MySQL.
 */
/*
var User = sequelize.define('Users', {
  uid: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    allowNull: false,
    primaryKey: true
  },
  user: {
    type: Sequelize.STRING(20),
    unique: true,
    allowNull: false,
	field: 'username'
  },
  pass: {
    type: Sequelize.STRING(60),
    allowNull: false,
	field: 'password'
  },
  utype: {
    type: Sequelize.ENUM('student', 'teacher', 'technician', 'removed'),
    allowNull: false,
  },
  sid: {
    type: Sequelize.CHAR(10),
    allowNull: false
  },
  fname: {
    type: Sequelize.STRING(20),
    allowNull: false,
	field: 'firstname'
  },
  lname: {
    type: Sequelize.STRING(20),
    allowNull: false,
	field: 'lastname'
  },
  phone: {
    type: Sequelize.CHAR(10),
    allowNull: true
  },
  email: {
    type: Sequelize.STRING(320),
    unique: true,
    allowNull: false
  },
  regtime: {
    type: Sequelize.DATE,
    allowNull: false
  }
}, {
  freezeTableName: true // Model tableName will be the same as the model name
});
*/
/*
var Requests = sequelize.define('Requests', {
  rid: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    allowNull: false,
    primaryKey: true
  },
  uid: {
    type: Sequelize.INTEGER,
    allowNull: false
  },
  rflag: {
    type: Sequelize.ENUM('approved', 'rejected', 'pending'),
    allowNull: false
  },
  rdata: {
    type: Sequelize.STRING(500),
    allowNull: false
  }
}, {
  freezeTableName: true // Model tableName will be the same as the model name
});
var EquipmentTypes = sequelize.define('EquipmentTypes', {
  etid: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    allowNull: false
    primaryKey: true
  },
  name: {
    type: Sequelize.STRING(100),
    allowNull: false
  },
  hv: {
    type: Sequelize.BIGINTEGER,
    allowNull: false
  },
  cat: {
    type: Sequelize.INTEGER,
    allowNull: false
  },
  desc: {
    type: Sequelize.STRING(200),
    allowNull: true
  },
  datasheet: {
    type: Sequelize.STRING(255),
    allowNull: true
  }
}, {
  freezeTableName: true // Model tableName will be the same as the model name
});
var Locations = sequelize.define('Locations', {
  lid: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    allowNull: false
    primaryKey: true
  },
  name: {
    type: Sequelize.STRING(20),
    allowNull: false
  }
  room: {
    type: Sequelize.CHAR(5),
    allowNull: false
  }
  desc: {
    type: Sequelize.STRING(200),
    allowNull: true
  }
}, {
  freezeTableName: true // Model tableName will be the same as the model name
});
var Equipment = sequelize.define('Equipment', {
  eid: {
    type: Sequelize.INTEGER,
    allowNull: false,
    autoIncrement: true
    primaryKey: true
  }
  etid: {
    type: Sequelize.INTEGER,
    allowNull: false
  }
  lid: {
    type: Sequelize.INTEGER,
    allowNull: false
  }
  ino: {
    type: Sequelize.INTEGER,
    allowNull: false
  }
}, {
  freezeTableName: true // Model tableName will be the same as the model name
});
var StatusReports = sequelize.define('StatusReports', {
  sid: {
    type: Sequelize.INTEGER,
    allowNull: false,
    autoIncrement: true,
    primaryKey: true
  }
  uid: {
    type: Sequelize.INTEGER,
    allowNull:false
  }
  eid: {
    type: Sequelize.INTEGER,
    allowNull: false
  }
  status: {
    type: ENUM('available', 'borrowed', 'out', 'low', 'broken', 'backup'),
    allowNull: false
  }
  srtime: {
    type: DATE
  }
  approved: {
    type: BIGINTEGER,
    allowNull: false
  }
}, {
  freezeTableName: true // Model tableName will be the same as the model name
});
var Kits = sequelize.define('Kits', {
  kid: {
    type: Sequelize.INTEGER,
    allowNull: false,
    autoIncrement: true
    primaryKey: true
  },
  uid: {
    type: Sequelize.INTEGER,
    allowNull: false
  }
  name: {
    type: Sequelize.STRING(50),
    allowNull: false
  }
  desc: {
    type: Sequelize.STRING(200),
    allowNull: true
  }
}, {
  freezeTableName: true // Model tableName will be the same as the model name
});
var KitEntries = sequelize.define('KitEntries', {
  kid: {
    type: Sequelize.INTEGER,
    allowNull: false,
    autoIncrement: true,
    primaryKey: true
  },
  etid: {
    type: Sequelize.INTEGER,
    allowNull: false,
    primaryKey: true
  }
  quantity: {
    type: Sequelize.INTEGER,
    allowNull: false
  }
}, {
  freezeTableName: true // Model tableName will be the same as the model name
});
*/