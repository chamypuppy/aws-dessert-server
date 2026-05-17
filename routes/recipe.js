const express = require("express");
const router = express.Router();
const db = require("../config/db");
const upload = require("../config/s3Config");

/* 레시피 방법 불러오기 + recipe와 recipe_method 테이블의 공통된 recipe_pk_id랑 매칭되어야 함 */
/* router
  .route('/method')
  .get((req, res) => {
  const query = 
  `
  select r.*, m.* from recipe r
  LEFT JOIN recipe_method m ON r.recipe_pk_id = m.recipe_pk_id;  
  `;
  db.query(query, (err, results) => {
    if (err) {
      console.error('💦recipe_method API 처리 시 에러가 발생하였습니다!: \n', err);
      res.status(500).send('서버 오류');
      return;
    } 

    const recipe_info = [];
    const recipe_method_info = [];

    results.forEach((row) => {
      if (row.recipe_pk_id) {
        const existingRecipe = recipe_info.find(r => r.recipe_pk_id === row.recipe_pk_id);
        if (!existingRecipe) {
          recipe_info.push({
            recipe_pk_id: row.recipe_pk_id,
            recipe_name: row.recipe_name,
            recipe_intro: row.recipe_intro,
            recipe_image: row.recipe_image,
            recipe_servings: row.recipe_servings,
            baking_level: row.baking_level,
            tags: row.tags,
            scrap_count: row.scrap_count,
            ingredient1: row.ingredient1,
            ingredient2: row.ingredient2,
            author_id: row.author_id,
            tips: row.tips,
          });
        }
      }

      if (row.method) {
        recipe_method_info.push({
          method_pk_id: row.method_pk_id,
          recipe_pk_id: row.recipe_pk_id,
          method: row.method,
          method_number: row.method_number,
        });
      }
    });

    res.json({
      recipeResult: recipe_info
      ,
      recipeMethodResult: recipe_method_info,
    });
  });
}); */

router
  .route('/detail/:recipe_pk_id')
  .get((req, res) => {
    const recipe_pk_id = req.query.recipe_pk_id;
    const query = 
    `select r.*, m.* from recipe r
    LEFT JOIN recipe_method m ON r.recipe_pk_id = m.recipe_pk_id
    WHERE r.recipe_pk_id = ?;`;
    db.query(query, [recipe_pk_id], (err, results) => {
      if (err) {
        console.error('🟡 /detail/:recipe_pk_id 에러: \n', err);
        res.status(500).send('서버 오류');
        return;
      } 

      const recipe_info = [];
      const recipe_method_info = [];

      results.forEach((row) => {
        if (row.recipe_pk_id) {
          const existingRecipe = recipe_info.find(r => r.recipe_pk_id === row.recipe_pk_id);
          if (!existingRecipe) {
            recipe_info.push({
              recipe_pk_id: row.recipe_pk_id,
              recipe_name: row.recipe_name,
              recipe_intro: row.recipe_intro,
              recipe_image: row.recipe_image,
              recipe_servings: row.recipe_servings,
              baking_level: row.baking_level,
              tags: row.tags,
              scrap_count: row.scrap_count,
              ingredient1: row.ingredient1,
              ingredient2: row.ingredient2,
              author_id: row.author_id,
              tips: row.tips,
            });
          }
        }

        if (row.method) {
          recipe_method_info.push({
            method_pk_id: row.method_pk_id,
            recipe_pk_id: row.recipe_pk_id,
            method: row.method,
            method_number: row.method_number,
          });
        }
      });

      res.json({
        recipeResult: recipe_info,
        recipeMethodResult: recipe_method_info,
      });
    });
});

router
  .route('/search')
  .get((req, res) => {

  const keyword = req.query.keyword;
  const query = `SELECT r.recipe_pk_id, r.recipe_name, r.recipe_image, r.scrap_count, u.nickname AS author_name FROM recipe r
      LEFT JOIN users u ON r.author_id = u.users_pk_id
      WHERE recipe_name LIKE ?;`

  const param = `%${keyword}%`;

  db.query(query, [param], (err, results) => {
    if(err) {
      console.error('💦recipe search API의 DB query에 에러가 발생했습니다!: \n', err);
      res.status(500).send('recipes search API 오류');
    } else {
      res.json(results);
      console.log('받은 API 확인:', results);
      console.log('받은 req.query:', JSON.stringify(req.query));
    }
  })

});

/* router
  .route('/recipe_pk_id')
  .get((req, res) => {

  const recipePkId = req.query.recipe_pk_id;
  const query = `SELECT recipe_pk_id FROM recipe WHERE recipe_pk_id LIKE ?;`

  db.query(query, [recipePkId], (err, results) => {
    if(err) {
      console.error('🟡 RECIPE_PK_ID 조회 실패: \n', err);
      res.status(500).send('RECIPE_PK_ID 조회 API 오류');
    } else {
      res.json(results);
      console.log('받은 API 확인:', results);
      console.log('받은 req.query:', JSON.stringify(req.query));
    }
  })

}); */

// recipe 가져오기, 수정하기, 삭제하기, 등록하기

router
  .route("/") /* 세미콜론 x 체이닝 */
  .get((req, res) => {
    const query = `
      SELECT 
        r.recipe_pk_id, 
        r.recipe_name, 
        r.recipe_image,
        r.scrap_count, 
        u.nickname AS author_name
      FROM recipe r
      LEFT JOIN users u ON r.author_id = u.users_pk_id;
    `;

    db.query(query, (err, results) => {
      if(err) {
        console.error('💦recipes API의 DB 쿼리에 에러가 발생했습니다!: \n', err);
        res.status(500).send('recipes API 오류');
      } else {
        res.json(results);
      }
    });
  })
  .put((req, res) => { res.status(405).json({ message: '이 경로는 지원하지 않습니다. /api/recipe/:id 를 사용하세요.' }); })
  .post((req, res) => { res.status(405).json({ message: '이 경로는 지원하지 않습니다. /api/recipe/add 를 사용하세요.' }); })
  .delete((req, res) => { res.status(405).json({ message: '이 경로는 지원하지 않습니다. /api/recipe/:id 를 사용하세요.' }); });


/* ✅ INSERT - 레시피 등록 */
router.post('/add', upload.single('image'), (req, res) => {
  if (!req.session.USER_PK_ID) {
    return res.status(401).json({ message: '로그인이 필요합니다.' });
  }

  const {
    recipe_name, recipe_intro, recipe_servings, baking_level,
    category_big, category_middle, category_machine,
    ingredient1, ingredient2, tips, tags, steps
  } = req.body;

  const recipe_image = req.file ? req.file.location : null;
  const author_id = req.session.USER_PK_ID;
  const parsedSteps = steps ? JSON.parse(steps) : [];

  const insertRecipeQuery = `
    INSERT INTO recipe (
      recipe_name, recipe_intro, recipe_image, recipe_servings,
      baking_level, author_id, category_big, category_middle,
      category_machine, ingredient1, ingredient2, tips, tags
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  db.query(insertRecipeQuery, [
    recipe_name, recipe_intro, recipe_image, recipe_servings,
    baking_level, author_id, category_big, category_middle,
    category_machine, ingredient1, ingredient2, tips, tags
  ], (err, result) => {
    if (err) {
      console.error('💦 레시피 등록 오류:', err);
      return res.status(500).json({ message: '레시피 등록에 실패했습니다.' });
    }

    const recipe_pk_id = result.insertId;

    if (parsedSteps.length === 0) {
      return res.status(201).json({ message: '레시피가 등록되었습니다.', recipe_pk_id });
    }

    const methodValues = parsedSteps.map((method, index) => [recipe_pk_id, method, index + 1]);
    db.query('INSERT INTO recipe_method (recipe_pk_id, method, method_number) VALUES ?', [methodValues], (err) => {
      if (err) {
        console.error('💦 레시피 방법 등록 오류:', err);
        return res.status(500).json({ message: '레시피 방법 등록에 실패했습니다.' });
      }
      res.status(201).json({ message: '레시피가 등록되었습니다.', recipe_pk_id });
    });
  });
});


/* ✅ UPDATE - 레시피 수정 */
router.put('/:recipe_pk_id', upload.single('image'), (req, res) => {
  if (!req.session.USER_PK_ID) {
    return res.status(401).json({ message: '로그인이 필요합니다.' });
  }

  const { recipe_pk_id } = req.params;
  const {
    recipe_name, recipe_intro, recipe_servings, baking_level,
    category_big, category_middle, category_machine,
    ingredient1, ingredient2, tips, tags, steps
  } = req.body;

  const parsedSteps = steps ? JSON.parse(steps) : [];
  const newImage = req.file ? req.file.location : null;

  const updateQuery = newImage
    ? `UPDATE recipe SET recipe_name=?, recipe_intro=?, recipe_image=?, recipe_servings=?,
        baking_level=?, category_big=?, category_middle=?, category_machine=?,
        ingredient1=?, ingredient2=?, tips=?, tags=?
       WHERE recipe_pk_id=? AND author_id=?`
    : `UPDATE recipe SET recipe_name=?, recipe_intro=?, recipe_servings=?,
        baking_level=?, category_big=?, category_middle=?, category_machine=?,
        ingredient1=?, ingredient2=?, tips=?, tags=?
       WHERE recipe_pk_id=? AND author_id=?`;

  const updateParams = newImage
    ? [recipe_name, recipe_intro, newImage, recipe_servings, baking_level,
       category_big, category_middle, category_machine, ingredient1, ingredient2,
       tips, tags, recipe_pk_id, req.session.USER_PK_ID]
    : [recipe_name, recipe_intro, recipe_servings, baking_level,
       category_big, category_middle, category_machine, ingredient1, ingredient2,
       tips, tags, recipe_pk_id, req.session.USER_PK_ID];

  db.query(updateQuery, updateParams, (err, result) => {
    if (err) {
      console.error('💦 레시피 수정 오류:', err);
      return res.status(500).json({ message: '레시피 수정에 실패했습니다.' });
    }
    if (result.affectedRows === 0) {
      return res.status(403).json({ message: '수정 권한이 없거나 레시피가 없습니다.' });
    }

    db.query('DELETE FROM recipe_method WHERE recipe_pk_id = ?', [recipe_pk_id], (err) => {
      if (err) {
        console.error('💦 레시피 방법 삭제 오류:', err);
        return res.status(500).json({ message: '레시피 방법 업데이트에 실패했습니다.' });
      }

      if (parsedSteps.length === 0) {
        return res.status(200).json({ message: '레시피가 수정되었습니다.', recipe_pk_id });
      }

      const methodValues = parsedSteps.map((method, index) => [recipe_pk_id, method, index + 1]);
      db.query('INSERT INTO recipe_method (recipe_pk_id, method, method_number) VALUES ?', [methodValues], (err) => {
        if (err) {
          console.error('💦 레시피 방법 재등록 오류:', err);
          return res.status(500).json({ message: '레시피 방법 재등록에 실패했습니다.' });
        }
        res.status(200).json({ message: '레시피가 수정되었습니다.', recipe_pk_id });
      });
    });
  });
});


/* ✅ DELETE - 레시피 삭제 */
router.delete('/:recipe_pk_id', (req, res) => {
  if (!req.session.USER_PK_ID) {
    return res.status(401).json({ message: '로그인이 필요합니다.' });
  }

  const { recipe_pk_id } = req.params;

  db.query('DELETE FROM recipe_method WHERE recipe_pk_id = ?', [recipe_pk_id], (err) => {
    if (err) {
      console.error('💦 recipe_method 삭제 오류:', err);
      return res.status(500).json({ message: '삭제에 실패했습니다.' });
    }

    db.query(
      'DELETE FROM recipe WHERE recipe_pk_id = ? AND author_id = ?',
      [recipe_pk_id, req.session.USER_PK_ID],
      (err, result) => {
        if (err) {
          console.error('💦 레시피 삭제 오류:', err);
          return res.status(500).json({ message: '삭제에 실패했습니다.' });
        }
        if (result.affectedRows === 0) {
          return res.status(403).json({ message: '삭제 권한이 없거나 레시피가 없습니다.' });
        }
        res.status(200).json({ message: '레시피가 삭제되었습니다.' });
      }
    );
  });
});


module.exports = router;