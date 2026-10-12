// Course content that should come from the backend (or CMS). Edit freely.
// NOTE: in production, exam answers must NEVER be sent to the browser. Grade on the server.
window.TAMP_CONTENT={
exams:{da:{minutes:20,pass:60,questions:[
{q:'Which step cleans errors from data?',options:['Collect','Clean','Share'],answer:1},
{q:'Which formula adds B2 to B10?',options:['=SUM(B2:B10)','=ADD(B2,B10)','=TOTAL(B2:B10)'],answer:0},
{q:'Which function removes extra spaces from text in a spreadsheet?',options:['TRIM','ROUND','COUNT'],answer:0},
{q:'What is a pivot table used for?',options:['Summarising large data quickly','Drawing shapes','Sending email'],answer:0},
{q:'What is the median of 2, 4 and 9?',options:['2','4','9'],answer:1},
{q:'Which SQL clause filters rows?',options:['ORDER BY','WHERE','LIMIT'],answer:1},
{q:'What does GROUP BY do?',options:['Sorts rows','Combines rows into groups','Deletes duplicates'],answer:1},
{q:'Which join keeps every row from the left table?',options:['INNER JOIN','LEFT JOIN','CROSS JOIN'],answer:1},
{q:'A correlation shows...',options:['That one thing causes another','How two things move together','The average of a set'],answer:1},
{q:'In an A/B test, what do you compare?',options:['Two versions of one thing','Two unrelated datasets','Two spreadsheets'],answer:0},
{q:'In pandas, which function reads a CSV file?',options:['read_csv','open_data','load_file'],answer:0},
{q:'Why should you document your analysis?',options:['So others can repeat and trust it','To make files bigger','To avoid sharing results'],answer:0}]}},
assignments:{da:[
{title:'Clean a messy sales sheet',brief:'You are given a spreadsheet of sales with duplicates, extra spaces and missing totals. Prepare it for analysis.',tasks:['Remove the duplicate rows','Use TRIM to fix extra spaces in text columns','Add a SUM total for the sales column','Write 3 sentences on what you changed and why']},
{title:'Sales analysis with SQL',brief:'Using the practice database, answer business questions about sales.',tasks:['Write a query for total sales per product','Filter your query to one month','Join the products and orders tables','Explain your findings in a short paragraph']},
{title:'Final project: analyse and present',brief:'Choose a public dataset and take it from raw data to a clear recommendation.',tasks:['Pick a dataset and state your question','Clean the data and list what you fixed','Analyse it and build at least two charts','Write a one-page summary with recommendations']}]}};
