# Project-1-MaxGPA

## Team 7: Hiro Robert Peyton Keagan
## Peyton was here

github: <https://github.com/hnakae/Project-1-MaxGPA>

SDS document: <https://docs.google.com/document/d/1NLye7ptwLU-Bzha-F7nVhyjYpdZsUW3X5xVEV1s8BvQ/edit?tab=t.0>

## Version Control Protocol

- Remember to git pull before pushing!
- Put your name in the git commit message: git commit -m 'msg:hiro'

## Getting Started

```bash
cd project-1-maxgpa
npm install
npm run dev 
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Description

This is going to be a web app that is going to help students at a university pick the required classes that they need for their selected major.

The distribution of grades awarded across all required classes in a major, as a predictor of GPA upon completion of a major.

The instructors that give the highest grades for all required classes in a major, shown in a sequence that permits students to plan, in advance, instructors to seek or avoid.

---

## architecture

- frontend:
    - nextjs ([js] framework) + tailwind (css library)
- backend:
    - api ([python] data science stuff + api endpoint for nextjs client)
    - db (mongo? [sqlite3] local postgres?)
- deployment:
    - [docker] (will need to do at the end before submission.)

## ---^---"Hiro"---^---

## ---v---"Robert"---v---

Python seems best for backend
Not sure best for frontend, Python or JS?
Database SQLite3 (open to options here, by no means a demand)

Docker Container with requirements

Python backend:
	Setup database - each specific course, across instructor across years
	Define SQL Queries
Import CSV Data
	Strip +, - from grades
	Populate database with sanitized data
	Accept queries from frontend and return data
	
<Language> Frontend:
desktop app?
I’m hesitant to make a web app, it seems like added complexity for little reason
Dropdowns for menu options?
Generate Report button
Pipeline between numpy/matplotlib and frontend 
Main Graph Area(?)
Do we need anything else?
Option to export the graph as a PDF or something?
	
Documentation for everything and justification for additional libraries. I don’t think we’ll need anything fancy for backend, frontend may be a different story, but I’m not super well versed in frontend stuff.

Numpy + pandas for backend math

Database tables
Query syntax
How we visualize everything

Hiro: Frontend?
Robert: Database
Peyton: Visualization
Kaegan: Documentation/Frontend?


Do we need 

Project Plan
Management
Peyton -> weekly reports, data visualization
Robert -> database
Kaegan -> data naturalization and sorting
Hiro -> Frontend

At time of writing, a ‘manager’ doesn’t seem needed. People are willing to fill in the role if it becomes necessary though.
People will work mainly in their specifications described above. However, if a part of the project falls behind, others will work with the person in their area to complete the part. 
In terms of team decisions, we can make them at weekly meetings that are hosted for a minimum of 1 hour. Outside of the meetings, we have each other's numbers.
Reporting will be done by Peyton, with a ~1 page summary of what happened each week. 

Build plan
—
// insert a spreadsheet or smth here for it (visual showcase of the plan) 
// discuss w kaegan

SRS
Problem statement:
	Students at the University of Oregon have a plethora of options when it comes to traversing a major. Different course schedules may land the same student a degree, but with varying outcomes relating to GPA and term workloads. The goal of our project is to provide a simple and effective tool that generates optimal paths to getting a degree. These paths will be generated taking into account the grade distributions of specific teachers, as well as specific classes. 
Users
Depending on your user class, you will be presented with different views and capabilities upon login. 
	Student:
University of Oregon students will login via a student login portal. Each student will have the ability to generate plans for a list of predefined majors, as well as save the plan for future reference.

Admin:
	Admin users should be able to upload new data for classes and majors. They should also have the ability to change major requirements. 
Use cases
// three specific, different, realistic scenarios
Requirements
// 20 needed, 6 non-functional
// from this, 2 more subcategories needed; absolutely required and not
SDS
Description
// externally visible behavior as precisely as possible
Design
// how all parts fit together + what parts are
// include system structure here clearly (maybe a diagram)
Major subsystems
// each major subsystem explained using static and dynamic models.
// all diagrams need to be clear and understandable
// design rationale for individual subsystems here