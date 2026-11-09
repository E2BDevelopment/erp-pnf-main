# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: ui-hardening.spec.ts >> facturación y alta de equipo tienen etiquetas accesibles
- Location: tests\e2e\ui-hardening.spec.ts:52:1

# Error details

```
Test timeout of 60000ms exceeded.
```

# Page snapshot

```yaml
- generic [ref=f2e1]:
  - generic [ref=f2e2]:
    - link "Saltar al contenido" [ref=f2e3] [cursor=pointer]:
      - /url: "#contenido"
    - generic [ref=f2e4]:
      - banner [ref=f2e5]:
        - link [ref=f2e7] [cursor=pointer]:
          - /url: /app/dashboard
          - img "Naranja Forte" [ref=f2e8]
        - generic [ref=f2e9]:
          - button "Notificaciones, ninguna sin leer" [ref=f2e10] [cursor=pointer]
          - button "Cuenta de RN" [ref=f2e11] [cursor=pointer]:
            - generic [ref=f2e12]: Cuenta de
            - generic [ref=f2e13]: RN
      - main [ref=f2e15]:
        - generic [ref=f2e16]:
          - generic [ref=f2e17]:
            - heading "Equipo" [level=1] [ref=f2e18]
            - paragraph [ref=f2e19]: Gestión de usuarios de la empresa y sus roles.
          - generic [ref=f2e20]:
            - generic [ref=f2e21]:
              - paragraph [ref=f2e22]: Usuarios de la empresa y su rol. El Director crea cuentas y comparte la contraseña manualmente.
              - button "Crear usuario" [active] [ref=f2e23] [cursor=pointer]
            - table [ref=f2e26]:
              - rowgroup [ref=f2e27]:
                - row [ref=f2e28]:
                  - columnheader "Nombre" [ref=f2e29]
                  - columnheader "Email" [ref=f2e30]
                  - columnheader "Rol" [ref=f2e31]
                  - columnheader "Acciones" [ref=f2e32]
              - rowgroup [ref=f2e33]:
                - row [ref=f2e34]:
                  - cell "Arq. Claudia Estrada Navarro" [ref=f2e35]
                  - cell "supervisor@demo.pnf" [ref=f2e36]
                  - cell "Supervisor" [ref=f2e37]
                  - cell [ref=f2e39]:
                    - button "Editar Arq. Claudia Estrada Navarro" [ref=f2e40] [cursor=pointer]
                    - button "Quitar Arq. Claudia Estrada Navarro del equipo" [ref=f2e41] [cursor=pointer]
                - row [ref=f2e42]:
                  - cell "Ing. Jorge Luis Mendoza Ríos" [ref=f2e43]
                  - cell "residente2@demo.pnf" [ref=f2e44]
                  - cell "Residente" [ref=f2e45]
                  - cell [ref=f2e47]:
                    - button "Editar Ing. Jorge Luis Mendoza Ríos" [ref=f2e48] [cursor=pointer]
                    - button "Quitar Ing. Jorge Luis Mendoza Ríos del equipo" [ref=f2e49] [cursor=pointer]
                - row [ref=f2e50]:
                  - cell "Ing. Mariana Torres Villalobos" [ref=f2e51]
                  - cell "residente@demo.pnf" [ref=f2e52]
                  - cell "Residente" [ref=f2e53]
                  - cell [ref=f2e55]:
                    - button "Editar Ing. Mariana Torres Villalobos" [ref=f2e56] [cursor=pointer]
                    - button "Quitar Ing. Mariana Torres Villalobos del equipo" [ref=f2e57] [cursor=pointer]
                - row [ref=f2e58]:
                  - cell "Luis Fernando Aguirre Campos" [ref=f2e59]
                  - cell "administrativo@demo.pnf" [ref=f2e60]
                  - cell "Administrativo" [ref=f2e61]
                  - cell [ref=f2e63]:
                    - button "Editar Luis Fernando Aguirre Campos" [ref=f2e64] [cursor=pointer]
                    - button "Quitar Luis Fernando Aguirre Campos del equipo" [ref=f2e65] [cursor=pointer]
                - row [ref=f2e66]:
                  - cell "Paola Guadalupe Serrano León" [ref=f2e67]
                  - cell "auxiliar@demo.pnf" [ref=f2e68]
                  - cell "Auxiliar" [ref=f2e69]
                  - cell [ref=f2e71]:
                    - button "Editar Paola Guadalupe Serrano León" [ref=f2e72] [cursor=pointer]
                    - button "Quitar Paola Guadalupe Serrano León del equipo" [ref=f2e73] [cursor=pointer]
                - row [ref=f2e74]:
                  - cell "Ricardo Naranja Salazar" [ref=f2e75]
                  - cell "director@demo.pnf" [ref=f2e76]
                  - cell "Director" [ref=f2e77]
                  - cell [ref=f2e79]:
                    - button "Editar Ricardo Naranja Salazar" [ref=f2e80] [cursor=pointer]
                    - button "Quitar Ricardo Naranja Salazar del equipo" [ref=f2e81] [cursor=pointer]
    - navigation "Administración" [ref=f2e82]:
      - generic [ref=f2e83]:
        - generic [ref=f2e84]:
          - link "Dashboard" [ref=f2e85] [cursor=pointer]:
            - /url: /app/dashboard
          - link "10 pendientes Requisiciones" [ref=f2e93] [cursor=pointer]:
            - /url: /app/admin/requisiciones
            - generic [ref=f2e98]:
              - generic [aria-hidden] [ref=f2e99]: 9+
              - generic [ref=f2e100]: 10 pendientes
            - generic [ref=f2e101]: Requisiciones
          - link "13 pendientes Por pagar" [ref=f2e102] [cursor=pointer]:
            - /url: /app/admin/cuentas-por-pagar
            - generic [ref=f2e107]:
              - generic [aria-hidden] [ref=f2e108]: 9+
              - generic [ref=f2e109]: 13 pendientes
            - generic [ref=f2e110]: Por pagar
          - link "Obras" [ref=f2e111] [cursor=pointer]:
            - /url: /app/obras
        - button "Más opciones" [ref=f2e119]:
          - generic [ref=f2e124]: Más
  - region "Notifications alt+T"
  - alert [ref=f2e125]
```