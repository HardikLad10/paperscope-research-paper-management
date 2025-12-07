-- ============================================================
-- Update PDF URLs for Demo Papers
-- Maps sample papers to real arXiv PDF URLs for demo purposes
-- ============================================================

USE research_paper_review_db;

-- U001's Top Reviewed Papers (will appear in Insights)
UPDATE Papers SET pdf_url = 'https://arxiv.org/pdf/1806.05009v3.pdf' 
WHERE paper_title = 'Graph Database Indexing';
-- Tree Edit Distance Learning (graph algorithms)

UPDATE Papers SET pdf_url = 'https://arxiv.org/pdf/1803.06333v3.pdf' 
WHERE paper_title = 'Distributed Query Optimization';
-- Snap ML: Hierarchical ML Framework

UPDATE Papers SET pdf_url = 'https://arxiv.org/pdf/1806.00187v3.pdf' 
WHERE paper_title = 'Efficient Joins in Practice';
-- Scaling Neural Machine Translation (optimization)

UPDATE Papers SET pdf_url = 'https://arxiv.org/pdf/1805.09300v3.pdf' 
WHERE paper_title = 'Vectorized Execution';
-- SNIPER: Efficient Multi-Scale Training

UPDATE Papers SET pdf_url = 'https://arxiv.org/pdf/1806.06778v5.pdf' 
WHERE paper_title = 'Branchless Hash Join';
-- BinGAN: Binary Descriptors (hashing)

UPDATE Papers SET pdf_url = 'https://arxiv.org/pdf/1802.05680v2.pdf' 
WHERE paper_title = 'Adaptive Query Plans';
-- Constraining Dynamics of Probabilistic Models

-- Other Important Papers
UPDATE Papers SET pdf_url = 'https://arxiv.org/pdf/1806.06827v2.pdf' 
WHERE paper_title = 'Learned Bloom Filters';
-- PAC-Bayes bounds (learning/optimization)

UPDATE Papers SET pdf_url = 'https://arxiv.org/pdf/1804.01756v3.pdf' 
WHERE paper_title = 'Learned Indexes Revisited';
-- Kanerva Machine: Generative Memory

UPDATE Papers SET pdf_url = 'https://arxiv.org/pdf/1805.04264v2.pdf' 
WHERE paper_title = 'Page Cache Modeling';
-- State Gradients for RNN Memory

UPDATE Papers SET pdf_url = 'https://arxiv.org/pdf/1706.07929v2.pdf' 
WHERE paper_title = 'Memory-Efficient Join Algorithms';
-- ISTA-Net: Optimization-Inspired Network

UPDATE Papers SET pdf_url = 'https://arxiv.org/pdf/1803.09797v4.pdf' 
WHERE paper_title = 'Storage Layout Showdown';
-- Women also Snowboard (data representation)

UPDATE Papers SET pdf_url = 'https://arxiv.org/pdf/1806.06464v2.pdf' 
WHERE paper_title = 'Real-time Analytics Processing';
-- Learning Policy Representations

UPDATE Papers SET pdf_url = 'https://arxiv.org/pdf/1806.05626v2.pdf' 
WHERE paper_title = 'CE on Text Data';
-- NCRF++: Neural Sequence Labeling

UPDATE Papers SET pdf_url = 'https://arxiv.org/pdf/1806.06575v3.pdf' 
WHERE paper_title = 'Log-Structured Systems';
-- RenderNet: Deep Network for Rendering

UPDATE Papers SET pdf_url = 'https://arxiv.org/pdf/1705.10819v2.pdf' 
WHERE paper_title = 'Hybrid CE with ML';
-- Surface Networks

-- Query Result Caching kept as sample (or update if needed)
UPDATE Papers SET pdf_url = 'https://arxiv.org/pdf/1806.06503v1.pdf' 
WHERE paper_title = 'Query Result Caching Strategies';
-- Deforming Autoencoders

