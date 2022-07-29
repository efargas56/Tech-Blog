const router = require("express").Router();
const { User, Post, Vote, Comment } = require("../../models");
const withAuth = require('../../utils/auth');

// GETs /api/users
router.get("/", (req, res) => {
  User.findAll({
    attributes: { exclude: ["password"] },
    order: [["id", "DESC"]],
  })
    .then((dbUserData) => res.json(dbUserData))
    .catch((err) => {
      console.log(err);
      req.status(500).json(err);
    });
});

// GETs /api/user/1
router.get("/:id", (req, res) => {
  User.findOne({
    attributes: { exclude: ["password"] },
    where: {
      id: req.params.id,
    },
    include: [
      {
        model: Post,
        attributes: ["id", "post_url", "title", "created_at"],
      },
      // the comment module
      {
        model: Comment,
        attributes: [
          "id",
          "comment_text",
          // 'created_at',
        ],
        include: {
          model: Post,
          attributes: ["title"],
        },
      },
      {
        model: Post,
        attributes: ["title"],
        through: Vote,
        as: "voted_posts",
      },
    ],
  })
    .then((dbUserData) => {
      if (!dbUserData) {
        res.status(404).json({ message: "No user found with this id" });
        return;
      }
      res.json(dbUserData);
    })
    .catch((err) => {
      console.log(err);
      res.status(500).json(err);
    });
});

// creates log in session
router.post("/login", (req, res) => {
  User.findOne({
    where: {
      email: req.body.email,
    },
  }).then((dbUserData) => {
    if (!dbUserData) {
      res.status(400).json({ message: "Email not found, please try again" });
      return;
    }
    const validatePassword = dbUserData.checkPassword(req.body.password);
    if (!validatePassword) {
      res.status(400).json({ message: "Incorrect password" });
      return;
    }
    req.session.save(() => {
      // declares session variables
      req.session.user_id = dbUserData.id;
      req.session.username = dbUserData.username;
      req.session.loggedIn = true;
      res.json({ user: dbUserData, message: "Logged In" });
    });
  });
});
// destroys log in session
router.post("/logout", withAuth, (req, res) => {
  if (req.session.loggedIn) {
    req.session.destroy(() => {
      res.status(204).end();
    });
  } else {
    res.status(404).end();
  }
});

// to create a user
router.post("/signup", (req, res) => {
  User.create({
    username: req.body.username,
    email: req.body.email,
    password: req.body.password,
  })
    .then((dbUserData) => {
      req.session.save(() => {
        req.session.user_id = dbUserData.id;
        req.session.username = dbUserData.username;
        req.session.loggedIn = true;
        res.json(dbUserData);
      });
    })
    .catch((err) => {
      console.log(err);
      res.status(500).json(err);
    });
});

// PUT /api/users/1
router.put("/:id", withAuth, (req, res) => {
  User.update(req.body, {
    individualHooks: true,
    where: {
      id: req.params.id,
    },
  })
    .then((dbUpdateData) => {
      if (!dbUpdateData[0]) {
        res.status(404).json({ message: "No user found with this id" });
        return;
      }
      res.json(dbUpdateData);
    })
    .catch((err) => {
      console.log(err);
      res.status(500).json(err);
    });
});

// DELETEs /api/users/1
router.delete("/:id",(req, res) => {
  User.destroy({
    where: {
      id: req.params.id,
    },
  })
    .then((dbUserData) => {
      if (!dbUserData) {
        res.status(404).json({ message: "No user is found with this id" });
        return;
      }
      res.json({
        deleted: dbUserData,
        message: `successfully deleted ${dbUserData} user`,
      });
    })
    .catch((err) => {
      console.log(err);
      res.status(500).json(err);
    });
});

module.exports = router;
//  hello