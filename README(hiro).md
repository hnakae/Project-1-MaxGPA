# Project-1-MaxGPA

github: <https://github.com/hnakae/Project-1-MaxGgit PA>

Hiro Robert Peyton Keagan

Description: This is going to be a web app that is going to help students at a university pick the required classes that they need for their selected major.

The distribution of grades awareded across all required classes in a major, as a predictor of GPA upon completion of a major.

The instructors that give the highest grades for all required classes in a major, shown in a sequnce that permits students to plan, in advance, instructors to seek or avoid.

---

architectural components to consider:
    - frontend: 
        - nextjs (js framework) + tailwind (css library)
    - backend:
        - api (typescript data science stuff + api endpoint for nextjs client)
            - instead of using python for some library to do this, do it manually.
        - db (mongo? sqlite3? local postgres?)
    - deployment:
        - docker (will need to do at the end before submission.)

tables we will need:
    - majors
    - classes
    - professors

use prisma to define the table schema.

once we have the tables, we can import the csv content into the database.

find graph library or ui components.

