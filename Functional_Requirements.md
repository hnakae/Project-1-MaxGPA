# Functional Requirements (v3)

## 2.1 Student User

### 2.1.1 Select Major and Degree

* The system should make it clear to the student user which majors and degree programs are in the system, and permit the user any one of those.

### 2.1.2 Select Years

* The system should make it clear to the student user which years of grade-history data are in the system, and permit the user to then select which span of school years to include in the report.
* Any span of years of data in the grade-history should be permitted.
* For example, if the system includes data from AY16 through AY 23 (AY16 is the academic year from Fall 2016 through Summer 2017), the user should be able to select just AY16, AY 16-AY23, or AY22-AY23.

---

## 2.2 Administrative User

### 2.2.1 Read-in the grade-history data

* The system should provide a means for the administrative user to read-in the grade-history data from the .CSV files provide, as follows.
* The headings shown in the first line of the grade-history.CSV file should be used to define how data are organized in the remaining lines, and thus how the data get read-in.
* Before replacing the grade history data currently in the system, the system should provide a facility to permit the administrator to confirm that the data will be read-in correctly.
* This could be accomplished by reading-in the file until encountering a line of non-null (non-asterisk) data, and then displaying that data so that the administrator can confirm that the fields will be read in correctly.
* This could be as simple as: TERM: 201501; TERM DESC: Fall 2015 SUBJ: AA; NUMB: 508. And then the administrator can proceed to update the data in the system, or leave it unchanged.
* To assist with testing this feature, a second grade-history data file has been added to the project directory in Canvas, which you should use to test this feature. It has an additional unneeded field. The file is at $=1$.
* Rationale: UO provides additional columns of data when requested. However, fortunately, UO appears to always use the same heading names.

### 2.2.2 Read-In Degree-Plan Data

* The system should read-in degree plan data that is acquired from the UO Catalog.
* There should be one file per degree plan. Please follow this pattern for naming the files, shown here for the two degree plans in Figure 1: Business Administration BA.CSV; Computer Science_BA.CSV.
* The degree plan information should be acquired from the UO catalog and be formatted into a.CSV file formatted as follows. YEAR, TERM, NUMB, SUBJ, TITLE; 1, 1, BA, 101Z, Introduction to Business.
* Note that this example corresponds to the first class shown in Figure 1. YEAR refers to the year in the degree program, and TERM is 1 for Fall, 2 for Winter, and 3 for Spring.
* The creation of these.CSV files may involve some human steps, which should be clearly described in the documentation for the system administrator.
* Note that Microsoft Excel actually does a good job of parsing web page data if you just copy the contents of a web page and paste it into an Excel spreadsheet. (Students should have access to Excel at <https://software.uoregon.edu/> . You can assume the person grading your project has Excel loaded on their machine.)
* The system should be delivered with the three correctly-formatted.CSV files necessary for the three degrees that your system works with such that the administrator (or person grading the project, and thus installing the system following your written instructions) is only required to complete the computer steps.
* To further clarify: The system does not need to "scrape" the catalog web pages.
* Similar to the requirements for the grade-history data, the system should provide a facility for the administrator to confirm that data were read-in correctly from the .CSV file before updating the data in the system.

### 2.2.3 Read-In Reconciliation File

* The system should provide a reusable means of reconciling (or connecting) data across the two data sets in the form of a file
* Some reconciliation of data will be required, such as to associate "Introduction to Business" in the UO Catalog to "Intro to Business" in the grade-history data, and to collapse "BA101Z" and "BA101" both data sets into "BA101" given that they seem to be the same class.
* These reconciliations should be recorded in a .CSV file entitled "entitled "Reconciliation.CSV" so that they can be reused in by all subsequent data loads, and should be applied to the grade-history data rather than the degree-requirements data (given that this is the less internally-consistent data set).
* The.CSV file should list changes to the grade-history data and be formatted as follows: CHANGE_FROM, TO; Intro to Business, Introduction to Business.
* It is expected that the same reconciliation file would continue to work when new grade-history files are acquired from the university. (Clearly this cannot be guaranteed, but this is the goal.)
* The system only needs to deliver reconciliation files for the three degree programs (from the three different majors) delivered with the system.

### 2.2.4 Independent updating of degree-requirement and grade-history data

* The system should permit both sets of data (grade-history and degree-requirements) to be updated independently.
* For example, it should be possible to update the grade-history datas without updating the degree plan data, and vice versa.
* Rationale: This permits the system to be updated as little as possible whenever new data become available.

---

## 2.3 Both Users

### 2.3.1 No Logins

* No logins should be required for either the student or administrator to use the software, other than logging on to the computer being used, such as logging on to the laptop.
