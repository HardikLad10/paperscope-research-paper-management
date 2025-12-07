-- Update timestamps for the 30 papers that were updated with real arXiv data
-- This will make them appear at the top of search results (ORDER BY upload_timestamp DESC)

UPDATE Papers 
SET upload_timestamp = NOW()
WHERE paper_id IN (
    'P603','P467','P966','P109','P738','P132','P748','P927','P208','P304',
    'P869','P178','P460','P943','P018','P269','P039','P175','P921','P951',
    'P017','P034','P205','P509','P774','P454','P264','P612','P822','P709'
);

-- Verify the updates
SELECT paper_id, paper_title, upload_timestamp 
FROM Papers 
ORDER BY upload_timestamp DESC 
LIMIT 10;
