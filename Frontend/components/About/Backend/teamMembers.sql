/* To get started: 
    - Download PostgreSQL. Follow this link to download for your OS 
    - Then to access the database hosted on NeonDB, run the following command:
        psql "postgresql://teamMembersDB_owner:npg_TW2amo6dINZF@ep-holy-unit-a8aq9e5m-pooler.eastus2.azure.neon.tech/teamMembersDB?sslmode=require"
    - You can run individual queries directly in terminal after entering the database
    - To run an entire script:
        \i path/to/this/script.sql
    - Base Cases are given below. Familiarize yourself with the columns of the database before making immediate changes.
*/

-- Use curl http://localhost:3000/api/team-members (this should print out the SQL table)

-- Creates team_members table -- already exists but this details the column name and types
--CREATE TABLE team_members (
--     name VARCHAR(100) NOT NULL,
--     role VARCHAR(100) NOT NULL,
--     founder BOOLEAN DEFAULT false,
--     management BOOLEAN DEFAULT false,
--     image_path TEXT NOT NULL,
--     github_url VARCHAR(255),
--     linkedin_url VARCHAR(255),
--     semester VARCHAR(50),
--     member_type VARCHAR(50)
-- );

-- Insert team members data
INSERT INTO team_members (name, role, founder, image_path, github_url, linkedin_url, semester, member_type) VALUES
    ('Ashley Chan', 'UI/UX Designer Intern', false, 'src/assets/HARPResearchLockUps/TeamMember/Intern/AshleyChan.png', 'https://github.com/dashboard', 'https://www.linkedin.com/feed/', 'Fall 2024', 'Developer'),
    ('Aoyan Sarkar', 'Full Stack Development Intern', false, 'src/assets/HARPResearchLockUps/TeamMember/Intern/AoyanSarkar.png', 'https://github.com/dashboard', 'https://www.linkedin.com/feed/', 'Fall 2024', 'Developer'),
    ('Caleb Dodson', 'Full Stack Development Intern', false, 'src/assets/HARPResearchLockUps/TeamMember/Intern/CalebDodson.png', 'https://github.com/dashboard', 'https://www.linkedin.com/feed/', 'Fall 2024', 'Developer'),
    ('Luke Summa', 'Full Stack Development Intern', false, 'src/assets/HARPResearchLockUps/TeamMember/Intern/LukeSumma.png', 'https://github.com/dashboard', 'https://www.linkedin.com/feed/', 'Fall 2024', 'Developer'),
    ('Michael Ortega', 'Full Stack Development Intern', false, 'src/assets/HARPResearchLockUps/TeamMember/Intern/MichaelOrtega.png', 'https://github.com/dashboard', 'https://www.linkedin.com/feed/', 'Fall 2024', 'Developer'),
    ('Linus Zwaka', 'Research Intern', false, 'src/assets/HARPResearchLockUps/TeamMember/Intern/LinusZwaka.png', 'https://github.com/dashboard', 'https://www.linkedin.com/feed/', 'Fall 2024', 'Researcher');


-- Update statement. Can be changed based on what needs to be updated
UPDATE team_members SET image_path = 'src/assets/HARPResearchLockUps/TeamMember/ManagementTeam/HarperChisari.png' WHERE name = 'Harper Chisari';