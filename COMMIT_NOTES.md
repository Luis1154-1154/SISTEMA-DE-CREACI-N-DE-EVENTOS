Commit notes and human-friendly descriptions

This file summarizes recent commits and provides clearer messages for reviewers.

Recent commits (repository HEAD -> main):

- 6235386: chore(db): add consolidated database_full.sql with schema and seeds
  - Added a single SQL file containing full schema and seeds. Later removed in favor of keeping only `api/database.sql`.

- 104db74: chore(categorias): seed predefined categories and disable API mutations
  - Seeded predefined categories and changed `categorias` controller to return 403 on POST/PUT/DELETE to prevent runtime category modifications.

- 086da42 / 51e5932: chore(db): add migration to add missing eventos columns
  - Added migrations to add columns (`lugar_id`, `estatus`, `metodo_inscripcion`, `tipo`, `organizador_id`) to `eventos`.

- 89a553d: refactor(categorias): remove descripcion column and update models/controllers
  - Removed `descripcion` field from `categorias` in schema and updated model/controller code accordingly.

- 2142eae: fix(mock+ui): use backend estatus values and color badges accordingly
  - Frontend mock events and UI badges adjusted to match backend `estatus` values.

If you'd like any of these actual commit messages rewritten in history, we can perform an interactive rebase (this will rewrite history and require force-push). You previously chose to avoid rewriting history; this file documents intended, human-friendly names instead.
