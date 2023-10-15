/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const snapshot = [
    {
      "id": "9k67dzf3isudpv3",
      "created": "2023-10-12 01:33:30.739Z",
      "updated": "2023-10-15 00:37:12.652Z",
      "name": "exercises",
      "type": "base",
      "system": false,
      "schema": [
        {
          "system": false,
          "id": "ttzmtaem",
          "name": "name",
          "type": "text",
          "required": true,
          "presentable": false,
          "unique": false,
          "options": {
            "min": null,
            "max": null,
            "pattern": ""
          }
        },
        {
          "system": false,
          "id": "ve2puyrc",
          "name": "start",
          "type": "date",
          "required": true,
          "presentable": false,
          "unique": false,
          "options": {
            "min": "",
            "max": ""
          }
        },
        {
          "system": false,
          "id": "nf58xfza",
          "name": "end",
          "type": "date",
          "required": true,
          "presentable": false,
          "unique": false,
          "options": {
            "min": "",
            "max": ""
          }
        },
        {
          "system": false,
          "id": "bvrglfys",
          "name": "started",
          "type": "bool",
          "required": false,
          "presentable": false,
          "unique": false,
          "options": {}
        },
        {
          "system": false,
          "id": "rggf31m0",
          "name": "stake_distribution",
          "type": "number",
          "required": true,
          "presentable": false,
          "unique": false,
          "options": {
            "min": 0.01,
            "max": 1,
            "noDecimal": false
          }
        },
        {
          "system": false,
          "id": "vcfs89bk",
          "name": "region_distribution",
          "type": "number",
          "required": true,
          "presentable": false,
          "unique": false,
          "options": {
            "min": 0.01,
            "max": 1,
            "noDecimal": false
          }
        },
        {
          "system": false,
          "id": "yqdmajiu",
          "name": "storehouse_distribution",
          "type": "number",
          "required": true,
          "presentable": false,
          "unique": false,
          "options": {
            "min": 0.01,
            "max": 1,
            "noDecimal": false
          }
        }
      ],
      "indexes": [],
      "listRule": "",
      "viewRule": "",
      "createRule": null,
      "updateRule": null,
      "deleteRule": null,
      "options": {}
    },
    {
      "id": "fqyayfmvzjwnc7m",
      "created": "2023-10-12 01:33:30.739Z",
      "updated": "2023-10-12 01:33:30.739Z",
      "name": "regions",
      "type": "base",
      "system": false,
      "schema": [
        {
          "system": false,
          "id": "avqg1m6c",
          "name": "name",
          "type": "text",
          "required": false,
          "presentable": false,
          "unique": false,
          "options": {
            "min": null,
            "max": null,
            "pattern": ""
          }
        }
      ],
      "indexes": [],
      "listRule": "",
      "viewRule": "",
      "createRule": null,
      "updateRule": null,
      "deleteRule": null,
      "options": {}
    },
    {
      "id": "1tv8gwd763rbxha",
      "created": "2023-10-12 01:33:30.739Z",
      "updated": "2023-10-15 00:37:12.661Z",
      "name": "stakes",
      "type": "base",
      "system": false,
      "schema": [
        {
          "system": false,
          "id": "qxezmgof",
          "name": "name",
          "type": "text",
          "required": false,
          "presentable": false,
          "unique": false,
          "options": {
            "min": null,
            "max": null,
            "pattern": ""
          }
        },
        {
          "system": false,
          "id": "v9euc7pn",
          "name": "region",
          "type": "relation",
          "required": true,
          "presentable": false,
          "unique": false,
          "options": {
            "collectionId": "fqyayfmvzjwnc7m",
            "cascadeDelete": true,
            "minSelect": null,
            "maxSelect": 1,
            "displayFields": null
          }
        }
      ],
      "indexes": [
        "CREATE INDEX `idx_b5eM1IO` ON `stakes` (`name`)"
      ],
      "listRule": "",
      "viewRule": "",
      "createRule": null,
      "updateRule": null,
      "deleteRule": null,
      "options": {}
    },
    {
      "id": "f18rsozza947st7",
      "created": "2023-10-12 01:33:30.739Z",
      "updated": "2023-10-15 00:37:12.637Z",
      "name": "items",
      "type": "base",
      "system": false,
      "schema": [
        {
          "system": false,
          "id": "xjp66hdh",
          "name": "description",
          "type": "text",
          "required": false,
          "presentable": false,
          "unique": false,
          "options": {
            "min": null,
            "max": null,
            "pattern": ""
          }
        },
        {
          "system": false,
          "id": "ccxmt8aw",
          "name": "quantity",
          "type": "text",
          "required": false,
          "presentable": false,
          "unique": false,
          "options": {
            "min": null,
            "max": null,
            "pattern": ""
          }
        },
        {
          "system": false,
          "id": "ipugd9ra",
          "name": "priority",
          "type": "text",
          "required": false,
          "presentable": false,
          "unique": false,
          "options": {
            "min": null,
            "max": null,
            "pattern": ""
          }
        }
      ],
      "indexes": [],
      "listRule": "",
      "viewRule": "",
      "createRule": null,
      "updateRule": null,
      "deleteRule": null,
      "options": {}
    },
    {
      "id": "0ivoml3p0vpnis8",
      "created": "2023-10-12 01:33:30.740Z",
      "updated": "2023-10-15 00:37:12.664Z",
      "name": "tasks",
      "type": "base",
      "system": false,
      "schema": [
        {
          "system": false,
          "id": "i1oqxdjt",
          "name": "resource_user",
          "type": "relation",
          "required": false,
          "presentable": false,
          "unique": false,
          "options": {
            "collectionId": "_pb_users_auth_",
            "cascadeDelete": false,
            "minSelect": null,
            "maxSelect": 1,
            "displayFields": null
          }
        },
        {
          "system": false,
          "id": "miv9caws",
          "name": "need_user",
          "type": "relation",
          "required": false,
          "presentable": false,
          "unique": false,
          "options": {
            "collectionId": "_pb_users_auth_",
            "cascadeDelete": false,
            "minSelect": null,
            "maxSelect": 1,
            "displayFields": null
          }
        },
        {
          "system": false,
          "id": "4woxubbn",
          "name": "item",
          "type": "relation",
          "required": false,
          "presentable": false,
          "unique": false,
          "options": {
            "collectionId": "f18rsozza947st7",
            "cascadeDelete": false,
            "minSelect": null,
            "maxSelect": 1,
            "displayFields": null
          }
        },
        {
          "system": false,
          "id": "7dknc0kd",
          "name": "completed",
          "type": "date",
          "required": false,
          "presentable": false,
          "unique": false,
          "options": {
            "min": "",
            "max": ""
          }
        },
        {
          "system": false,
          "id": "d475aton",
          "name": "resource_confirmed",
          "type": "bool",
          "required": false,
          "presentable": false,
          "unique": false,
          "options": {}
        },
        {
          "system": false,
          "id": "xxctezix",
          "name": "cancelled",
          "type": "date",
          "required": false,
          "presentable": false,
          "unique": false,
          "options": {
            "min": "",
            "max": ""
          }
        },
        {
          "system": false,
          "id": "dysxqcpz",
          "name": "resource_rejected",
          "type": "bool",
          "required": false,
          "presentable": false,
          "unique": false,
          "options": {}
        }
      ],
      "indexes": [
        "CREATE INDEX `idx_S8L7PVS` ON `tasks` (`resource_user`)",
        "CREATE INDEX `idx_XThDWuS` ON `tasks` (`need_user`)"
      ],
      "listRule": "@request.auth.id = resource_user || @request.auth.id = need_user",
      "viewRule": "@request.auth.id = resource_user || @request.auth.id = need_user",
      "createRule": null,
      "updateRule": "@request.auth.id = resource_user || @request.auth.id = need_user",
      "deleteRule": null,
      "options": {}
    },
    {
      "id": "_pb_users_auth_",
      "created": "2023-10-15 00:37:12.579Z",
      "updated": "2023-10-15 00:37:12.658Z",
      "name": "users",
      "type": "auth",
      "system": false,
      "schema": [
        {
          "system": false,
          "id": "2mucq674",
          "name": "stake",
          "type": "relation",
          "required": true,
          "presentable": false,
          "unique": false,
          "options": {
            "collectionId": "1tv8gwd763rbxha",
            "cascadeDelete": false,
            "minSelect": null,
            "maxSelect": 1,
            "displayFields": null
          }
        },
        {
          "system": false,
          "id": "m1flghu1",
          "name": "callsign",
          "type": "text",
          "required": true,
          "presentable": false,
          "unique": false,
          "options": {
            "min": 3,
            "max": null,
            "pattern": ""
          }
        },
        {
          "system": false,
          "id": "jcf0aw1b",
          "name": "ready",
          "type": "bool",
          "required": false,
          "presentable": false,
          "unique": false,
          "options": {}
        }
      ],
      "indexes": [
        "CREATE UNIQUE INDEX `idx_d6OGWnr` ON `users` (`callsign`)"
      ],
      "listRule": "id = @request.auth.id",
      "viewRule": "id = @request.auth.id",
      "createRule": "",
      "updateRule": "id = @request.auth.id && @request.data.searching:isset = false",
      "deleteRule": null,
      "options": {
        "allowEmailAuth": false,
        "allowOAuth2Auth": false,
        "allowUsernameAuth": true,
        "exceptEmailDomains": null,
        "manageRule": null,
        "minPasswordLength": 6,
        "onlyEmailDomains": null,
        "requireEmail": false
      }
    }
  ];

  const collections = snapshot.map((item) => new Collection(item));

  return Dao(db).importCollections(collections, true, null);
}, (db) => {
  return null;
})
