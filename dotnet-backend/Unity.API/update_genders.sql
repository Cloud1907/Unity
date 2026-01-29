-- Update all users to male except Elvan Gürsel
UPDATE Users 
SET Gender = 'male' 
WHERE FullName != 'Elvan Gürsel' OR FullName IS NULL;

UPDATE Users 
SET Gender = 'female' 
WHERE FullName = 'Elvan Gürsel';

-- Show results
SELECT Id, FullName, Gender FROM Users;
