-- Update latest 30 papers with real arXiv data from papers_v2.csv
-- Setting upload_timestamp = NULL to trigger automatic timestamp update

-- Paper 1: P603 -> PAC-Bayes bounds for stable algorithms with instance-depende...
UPDATE Papers 
SET 
    paper_title = 'PAC-Bayes bounds for stable algorithms with instance-dependent priors',
    abstract = 'PAC-Bayes bounds have been proposed to get risk estimates based on a training
sample. In this paper the PAC-Bayes approach is combined with stability of the
hypothesis learned by a Hilbert space valued algorithm. The PAC-Bayes setting
is used with a Gaussian prior centered at the expected output. Thus a novelty
of our paper is using priors defined in terms of the data-generating
distribution. Our main result estimates the risk of the randomized algorithm in
terms of the hypothesis stability coefficients. We also provide a new bound for
the SVM classifier, which is compared to other known bounds experimentally.
Ours appears to be the first stability-based bound that evaluates to
non-trivial values.',
    pdf_url = 'http://arxiv.org/pdf/1806.06827v2.pdf',
    upload_timestamp = NULL
WHERE paper_id = 'P603';

-- Paper 2: P467 -> Scaling Neural Machine Translation...
UPDATE Papers 
SET 
    paper_title = 'Scaling Neural Machine Translation',
    abstract = 'Sequence to sequence learning models still require several days to reach
state of the art performance on large benchmark datasets using a single
machine. This paper shows that reduced precision and large batch training can
speedup training by nearly 5x on a single 8-GPU machine with careful tuning and
implementation. On WMT''14 English-German translation, we match the accuracy of
Vaswani et al. (2017) in under 5 hours when training on 8 GPUs and we obtain a
new state of the art of 29.3 BLEU after training for 85 minutes on 128 GPUs. We
further improve these results to 29.8 BLEU by training on the much larger
Paracrawl dataset. On the WMT''14 English-French task, we obtain a
state-of-the-art BLEU of 43.2 in 8.5 hours on 128 GPUs.',
    pdf_url = 'http://arxiv.org/pdf/1806.00187v3.pdf',
    upload_timestamp = NULL
WHERE paper_id = 'P467';

-- Paper 3: P966 -> BinGAN: Learning Compact Binary Descriptors with a Regulariz...
UPDATE Papers 
SET 
    paper_title = 'BinGAN: Learning Compact Binary Descriptors with a Regularized GAN',
    abstract = 'In this paper, we propose a novel regularization method for Generative
Adversarial Networks, which allows the model to learn discriminative yet
compact binary representations of image patches (image descriptors). We employ
the dimensionality reduction that takes place in the intermediate layers of the
discriminator network and train binarized low-dimensional representation of the
penultimate layer to mimic the distribution of the higher-dimensional preceding
layers. To achieve this, we introduce two loss terms that aim at: (i) reducing
the correlation between the dimensions of the binarized low-dimensional
representation of the penultimate layer i. e. maximizing joint entropy) and
(ii) propagating the relations between the dimensions in the high-dimensional
space to the low-dimensional space. We evaluate the resulting binary image
descriptors on two challenging applications, image matching and retrieval, and
achieve state-of-the-art results.',
    pdf_url = 'http://arxiv.org/pdf/1806.06778v5.pdf',
    upload_timestamp = NULL
WHERE paper_id = 'P966';

-- Paper 4: P109 -> Surface Networks...
UPDATE Papers 
SET 
    paper_title = 'Surface Networks',
    abstract = 'We study data-driven representations for three-dimensional triangle meshes,
which are one of the prevalent objects used to represent 3D geometry. Recent
works have developed models that exploit the intrinsic geometry of manifolds
and graphs, namely the Graph Neural Networks (GNNs) and its spectral variants,
which learn from the local metric tensor via the Laplacian operator. Despite
offering excellent sample complexity and built-in invariances, intrinsic
geometry alone is invariant to isometric deformations, making it unsuitable for
many applications. To overcome this limitation, we propose several upgrades to
GNNs to leverage extrinsic differential geometry properties of
three-dimensional surfaces, increasing its modeling power.
  In particular, we propose to exploit the Dirac operator, whose spectrum
detects principal curvature directions --- this is in stark contrast with the
classical Laplace operator, which directly measures mean curvature. We coin the
resulting models \\emph{Surface Networks (SN)}. We prove that these models
define shape representations that are stable to deformation and to
discretization, and we demonstrate the efficiency and versatility of SNs on two
challenging tasks: temporal prediction of mesh deformations under non-linear
dynamics and generative models using a variational autoencoder framework with
encoders/decoders given by SNs.',
    pdf_url = 'http://arxiv.org/pdf/1705.10819v2.pdf',
    upload_timestamp = NULL
WHERE paper_id = 'P109';

-- Paper 5: P738 -> Extracting Automata from Recurrent Neural Networks Using Que...
UPDATE Papers 
SET 
    paper_title = 'Extracting Automata from Recurrent Neural Networks Using Queries and Counterexamples',
    abstract = 'We present a novel algorithm that uses exact learning and abstraction to extract a deterministic finite automaton describing the state dynamics of a given trained RNN. We do this using Angluin''s L* algorithm as a learner and the trained RNN as an oracle. Our technique efficiently extracts accurate automata from trained RNNs, even when the state vectors are large and require fine differentiation.',
    pdf_url = 'https://arxiv.org/pdf/1711.09576v4.pdf',
    upload_timestamp = NULL
WHERE paper_id = 'P738';

-- Paper 6: P132 -> Tree Edit Distance Learning via Adaptive Symbol Embeddings...
UPDATE Papers 
SET 
    paper_title = 'Tree Edit Distance Learning via Adaptive Symbol Embeddings',
    abstract = 'Metric learning has the aim to improve classification accuracy by learning a
distance measure which brings data points from the same class closer together
and pushes data points from different classes further apart. Recent research
has demonstrated that metric learning approaches can also be applied to trees,
such as molecular structures, abstract syntax trees of computer programs, or
syntax trees of natural language, by learning the cost function of an edit
distance, i.e. the costs of replacing, deleting, or inserting nodes in a tree.
However, learning such costs directly may yield an edit distance which violates
metric axioms, is challenging to interpret, and may not generalize well. In
this contribution, we propose a novel metric learning approach for trees which
we call embedding edit distance learning (BEDL) and which learns an edit
distance indirectly by embedding the tree nodes as vectors, such that the
Euclidean distance between those vectors supports class discrimination. We
learn such embeddings by reducing the distance to prototypical trees from the
same class and increasing the distance to prototypical trees from different
classes. In our experiments, we show that BEDL improves upon the
state-of-the-art in metric learning for trees on six benchmark data sets,
ranging from computer science over biomedical data to a natural-language
processing data set containing over 300,000 nodes.',
    pdf_url = 'http://arxiv.org/pdf/1806.05009v3.pdf',
    upload_timestamp = NULL
WHERE paper_id = 'P132';

-- Paper 7: P748 -> Banach Wasserstein GAN...
UPDATE Papers 
SET 
    paper_title = 'Banach Wasserstein GAN',
    abstract = 'Wasserstein Generative Adversarial Networks (WGANs) can be used to generate
realistic samples from complicated image distributions. The Wasserstein metric
used in WGANs is based on a notion of distance between individual images, which
induces a notion of distance between probability distributions of images. So
far the community has considered $\\ell^2$ as the underlying distance. We
generalize the theory of WGAN with gradient penalty to Banach spaces, allowing
practitioners to select the features to emphasize in the generator. We further
discuss the effect of some particular choices of underlying norms, focusing on
Sobolev norms. Finally, we demonstrate a boost in performance for an
appropriate choice of norm on CIFAR-10 and CelebA.',
    pdf_url = 'http://arxiv.org/pdf/1806.06621v2.pdf',
    upload_timestamp = NULL
WHERE paper_id = 'P748';

-- Paper 8: P927 -> Comparison-Based Random Forests...
UPDATE Papers 
SET 
    paper_title = 'Comparison-Based Random Forests',
    abstract = 'Assume we are given a set of items from a general metric space, but we
neither have access to the representation of the data nor to the distances
between data points. Instead, suppose that we can actively choose a triplet of
items (A,B,C) and ask an oracle whether item A is closer to item B or to item
C. In this paper, we propose a novel random forest algorithm for regression and
classification that relies only on such triplet comparisons. In the theory part
of this paper, we establish sufficient conditions for the consistency of such a
forest. In a set of comprehensive experiments, we then demonstrate that the
proposed random forest is efficient both for classification and regression. In
particular, it is even competitive with other methods that have direct access
to the metric representation of the data.',
    pdf_url = 'http://arxiv.org/pdf/1806.06616v1.pdf',
    upload_timestamp = NULL
WHERE paper_id = 'P927';

-- Paper 9: P208 -> Snap ML: A Hierarchical Framework for Machine Learning...
UPDATE Papers 
SET 
    paper_title = 'Snap ML: A Hierarchical Framework for Machine Learning',
    abstract = 'We describe a new software framework for fast training of generalized linear
models. The framework, named Snap Machine Learning (Snap ML), combines recent
advances in machine learning systems and algorithms in a nested manner to
reflect the hierarchical architecture of modern computing systems. We prove
theoretically that such a hierarchical system can accelerate training in
distributed environments where intra-node communication is cheaper than
inter-node communication. Additionally, we provide a review of the
implementation of Snap ML in terms of GPU acceleration, pipelining,
communication patterns and software architecture, highlighting aspects that
were critical for achieving high performance. We evaluate the performance of
Snap ML in both single-node and multi-node environments, quantifying the
benefit of the hierarchical scheme and the data streaming functionality, and
comparing with other widely-used machine learning software frameworks. Finally,
we present a logistic regression benchmark on the Criteo Terabyte Click Logs
dataset and show that Snap ML achieves the same test loss an order of magnitude
faster than any of the previously reported results, including those obtained
using TensorFlow and scikit-learn.',
    pdf_url = 'http://arxiv.org/pdf/1803.06333v3.pdf',
    upload_timestamp = NULL
WHERE paper_id = 'P208';

-- Paper 10: P304 -> The Kanerva Machine: A Generative Distributed Memory...
UPDATE Papers 
SET 
    paper_title = 'The Kanerva Machine: A Generative Distributed Memory',
    abstract = 'We present an end-to-end trained memory system that quickly adapts to new
data and generates samples like them. Inspired by Kanerva''s sparse distributed
memory, it has a robust distributed reading and writing mechanism. The memory
is analytically tractable, which enables optimal on-line compression via a
Bayesian update-rule. We formulate it as a hierarchical conditional generative
model, where memory provides a rich data-dependent prior distribution.
Consequently, the top-down memory and bottom-up perception are combined to
produce the code representing an observation. Empirically, we demonstrate that
the adaptive memory significantly improves generative models trained on both
the Omniglot and CIFAR datasets. Compared with the Differentiable Neural
Computer (DNC) and its variants, our memory model has greater capacity and is
significantly easier to train.',
    pdf_url = 'http://arxiv.org/pdf/1804.01756v3.pdf',
    upload_timestamp = NULL
WHERE paper_id = 'P304';

-- Paper 11: P869 -> RenderNet: A deep convolutional network for differentiable r...
UPDATE Papers 
SET 
    paper_title = 'RenderNet: A deep convolutional network for differentiable rendering from 3D shapes',
    abstract = 'Traditional computer graphics rendering pipeline is designed for procedurally
generating 2D quality images from 3D shapes with high performance. The
non-differentiability due to discrete operations such as visibility computation
makes it hard to explicitly correlate rendering parameters and the resulting
image, posing a significant challenge for inverse rendering tasks. Recent work
on differentiable rendering achieves differentiability either by designing
surrogate gradients for non-differentiable operations or via an approximate but
differentiable renderer. These methods, however, are still limited when it
comes to handling occlusion, and restricted to particular rendering effects. We
present RenderNet, a differentiable rendering convolutional network with a
novel projection unit that can render 2D images from 3D shapes. Spatial
occlusion and shading calculation are automatically encoded in the network. Our
experiments show that RenderNet can successfully learn to implement different
shaders, and can be used in inverse rendering tasks to estimate shape, pose,
lighting and texture from a single image.',
    pdf_url = 'http://arxiv.org/pdf/1806.06575v3.pdf',
    upload_timestamp = NULL
WHERE paper_id = 'P869';

-- Paper 12: P178 -> ISTA-Net: Interpretable Optimization-Inspired Deep Network f...
UPDATE Papers 
SET 
    paper_title = 'ISTA-Net: Interpretable Optimization-Inspired Deep Network for Image Compressive Sensing',
    abstract = 'With the aim of developing a fast yet accurate algorithm for compressive
sensing (CS) reconstruction of natural images, we combine in this paper the
merits of two existing categories of CS methods: the structure insights of
traditional optimization-based methods and the speed of recent network-based
ones. Specifically, we propose a novel structured deep network, dubbed
ISTA-Net, which is inspired by the Iterative Shrinkage-Thresholding Algorithm
(ISTA) for optimizing a general $\\ell_1$ norm CS reconstruction model. To cast
ISTA into deep network form, we develop an effective strategy to solve the
proximal mapping associated with the sparsity-inducing regularizer using
nonlinear transforms. All the parameters in ISTA-Net (\\eg nonlinear transforms,
shrinkage thresholds, step sizes, etc.) are learned end-to-end, rather than
being hand-crafted. Moreover, considering that the residuals of natural images
are more compressible, an enhanced version of ISTA-Net in the residual domain,
dubbed {ISTA-Net}$^+$, is derived to further improve CS reconstruction.
Extensive CS experiments demonstrate that the proposed ISTA-Nets outperform
existing state-of-the-art optimization-based and network-based CS methods by
large margins, while maintaining fast computational speed. Our source codes are
available: \\textsl{http://jianzhang.tech/projects/ISTA-Net}.',
    pdf_url = 'http://arxiv.org/pdf/1706.07929v2.pdf',
    upload_timestamp = NULL
WHERE paper_id = 'P178';

-- Paper 13: P460 -> State Gradients for RNN Memory Analysis...
UPDATE Papers 
SET 
    paper_title = 'State Gradients for RNN Memory Analysis',
    abstract = 'We present a framework for analyzing what the state in RNNs remembers from
its input embeddings. Our approach is inspired by backpropagation, in the sense
that we compute the gradients of the states with respect to the input
embeddings. The gradient matrix is decomposed with Singular Value Decomposition
to analyze which directions in the embedding space are best transferred to the
hidden state space, characterized by the largest singular values. We apply our
approach to LSTM language models and investigate to what extent and for how
long certain classes of words are remembered on average for a certain corpus.
Additionally, the extent to which a specific property or relationship is
remembered by the RNN can be tracked by comparing a vector characterizing that
property with the direction(s) in embedding space that are best preserved in
hidden state space.',
    pdf_url = 'http://arxiv.org/pdf/1805.04264v2.pdf',
    upload_timestamp = NULL
WHERE paper_id = 'P460';

-- Paper 14: P943 -> SNIPER: Efficient Multi-Scale Training...
UPDATE Papers 
SET 
    paper_title = 'SNIPER: Efficient Multi-Scale Training',
    abstract = 'We present SNIPER, an algorithm for performing efficient multi-scale training
in instance level visual recognition tasks. Instead of processing every pixel
in an image pyramid, SNIPER processes context regions around ground-truth
instances (referred to as chips) at the appropriate scale. For background
sampling, these context-regions are generated using proposals extracted from a
region proposal network trained with a short learning schedule. Hence, the
number of chips generated per image during training adaptively changes based on
the scene complexity. SNIPER only processes 30% more pixels compared to the
commonly used single scale training at 800x1333 pixels on the COCO dataset.
But, it also observes samples from extreme resolutions of the image pyramid,
like 1400x2000 pixels. As SNIPER operates on resampled low resolution chips
(512x512 pixels), it can have a batch size as large as 20 on a single GPU even
with a ResNet-101 backbone. Therefore it can benefit from batch-normalization
during training without the need for synchronizing batch-normalization
statistics across GPUs. SNIPER brings training of instance level recognition
tasks like object detection closer to the protocol for image classification and
suggests that the commonly accepted guideline that it is important to train on
high resolution images for instance level visual recognition tasks might not be
correct. Our implementation based on Faster-RCNN with a ResNet-101 backbone
obtains an mAP of 47.6% on the COCO dataset for bounding box detection and can
process 5 images per second during inference with a single GPU. Code is
available at https://github.com/MahyarNajibi/SNIPER/.',
    pdf_url = 'http://arxiv.org/pdf/1805.09300v3.pdf',
    upload_timestamp = NULL
WHERE paper_id = 'P943';

-- Paper 15: P018 -> Constraining the Dynamics of Deep Probabilistic Models...
UPDATE Papers 
SET 
    paper_title = 'Constraining the Dynamics of Deep Probabilistic Models',
    abstract = 'We introduce a novel generative formulation of deep probabilistic models
implementing "soft" constraints on their function dynamics. In particular, we
develop a flexible methodological framework where the modeled functions and
derivatives of a given order are subject to inequality or equality constraints.
We then characterize the posterior distribution over model and constraint
parameters through stochastic variational inference. As a result, the proposed
approach allows for accurate and scalable uncertainty quantification on the
predictions and on all parameters. We demonstrate the application of equality
constraints in the challenging problem of parameter inference in ordinary
differential equation models, while we showcase the application of inequality
constraints on the problem of monotonic regression of count data. The proposed
approach is extensively tested in several experimental settings, leading to
highly competitive results in challenging modeling applications, while offering
high expressiveness, flexibility and scalability.',
    pdf_url = 'http://arxiv.org/pdf/1802.05680v2.pdf',
    upload_timestamp = NULL
WHERE paper_id = 'P018';

-- Paper 16: P269 -> Deforming Autoencoders: Unsupervised Disentangling of Shape ...
UPDATE Papers 
SET 
    paper_title = 'Deforming Autoencoders: Unsupervised Disentangling of Shape and Appearance',
    abstract = 'In this work we introduce Deforming Autoencoders, a generative model for
images that disentangles shape from appearance in an unsupervised manner. As in
the deformable template paradigm, shape is represented as a deformation between
a canonical coordinate system (`template'') and an observed image, while
appearance is modeled in `canonical'', template, coordinates, thus discarding
variability due to deformations. We introduce novel techniques that allow this
approach to be deployed in the setting of autoencoders and show that this
method can be used for unsupervised group-wise image alignment. We show
experiments with expression morphing in humans, hands, and digits, face
manipulation, such as shape and appearance interpolation, as well as
unsupervised landmark localization. A more powerful form of unsupervised
disentangling becomes possible in template coordinates, allowing us to
successfully decompose face images into shading and albedo, and further
manipulate face images.',
    pdf_url = 'http://arxiv.org/pdf/1806.06503v1.pdf',
    upload_timestamp = NULL
WHERE paper_id = 'P269';

-- Paper 17: P039 -> Women also Snowboard: Overcoming Bias in Captioning Models...
UPDATE Papers 
SET 
    paper_title = 'Women also Snowboard: Overcoming Bias in Captioning Models',
    abstract = 'Most machine learning methods are known to capture and exploit biases of the
training data. While some biases are beneficial for learning, others are
harmful. Specifically, image captioning models tend to exaggerate biases
present in training data (e.g., if a word is present in 60% of training
sentences, it might be predicted in 70% of sentences at test time). This can
lead to incorrect captions in domains where unbiased captions are desired, or
required, due to over-reliance on the learned prior and image context. In this
work we investigate generation of gender-specific caption words (e.g. man,
woman) based on the person''s appearance or the image context. We introduce a
new Equalizer model that ensures equal gender probability when gender evidence
is occluded in a scene and confident predictions when gender evidence is
present. The resulting model is forced to look at a person rather than use
contextual cues to make a gender-specific predictions. The losses that comprise
our model, the Appearance Confusion Loss and the Confident Loss, are general,
and can be added to any description model in order to mitigate impacts of
unwanted bias in a description dataset. Our proposed model has lower error than
prior work when describing images with people and mentioning their gender and
more closely matches the ground truth ratio of sentences including women to
sentences including men. We also show that unlike other approaches, our model
is indeed more often looking at people when predicting their gender.',
    pdf_url = 'http://arxiv.org/pdf/1803.09797v4.pdf',
    upload_timestamp = NULL
WHERE paper_id = 'P039';

-- Paper 18: P175 -> Learning Policy Representations in Multiagent Systems...
UPDATE Papers 
SET 
    paper_title = 'Learning Policy Representations in Multiagent Systems',
    abstract = 'Modeling agent behavior is central to understanding the emergence of complex
phenomena in multiagent systems. Prior work in agent modeling has largely been
task-specific and driven by hand-engineering domain-specific prior knowledge.
We propose a general learning framework for modeling agent behavior in any
multiagent system using only a handful of interaction data. Our framework casts
agent modeling as a representation learning problem. Consequently, we construct
a novel objective inspired by imitation learning and agent identification and
design an algorithm for unsupervised learning of representations of agent
policies. We demonstrate empirically the utility of the proposed framework in
(i) a challenging high-dimensional competitive environment for continuous
control and (ii) a cooperative environment for communication, on supervised
predictive tasks, unsupervised clustering, and policy optimization using deep
reinforcement learning.',
    pdf_url = 'http://arxiv.org/pdf/1806.06464v2.pdf',
    upload_timestamp = NULL
WHERE paper_id = 'P175';

-- Paper 19: P921 -> NCRF++: An Open-source Neural Sequence Labeling Toolkit...
UPDATE Papers 
SET 
    paper_title = 'NCRF++: An Open-source Neural Sequence Labeling Toolkit',
    abstract = 'This paper describes NCRF++, a toolkit for neural sequence labeling. NCRF++
is designed for quick implementation of different neural sequence labeling
models with a CRF inference layer. It provides users with an inference for
building the custom model structure through configuration file with flexible
neural feature design and utilization. Built on PyTorch, the core operations
are calculated in batch, making the toolkit efficient with the acceleration of
GPU. It also includes the implementations of most state-of-the-art neural
sequence labeling models such as LSTM-CRF, facilitating reproducing and
refinement on those methods.',
    pdf_url = 'http://arxiv.org/pdf/1806.05626v2.pdf',
    upload_timestamp = NULL
WHERE paper_id = 'P921';

-- Paper 20: P951 -> Online Prediction of Switching Graph Labelings with Cluster ...
UPDATE Papers 
SET 
    paper_title = 'Online Prediction of Switching Graph Labelings with Cluster Specialists',
    abstract = 'We address the problem of predicting the labeling of a graph in an online setting when the labeling is changing over time. We present an algorithm based on a specialist approach; we develop the machinery of cluster specialists which probabilistically exploits the cluster structure in the graph. Our algorithm has two variants, one of which surprisingly only requires $\\mathcal{O}(\\log n)$ time on any trial $t$ on an $n$-vertex graph, an exponential speed up over existing methods. We prove switching mistake-bound guarantees for both variants of our algorithm. Furthermore these mistake bounds smoothly vary with the magnitude of the change between successive labelings. We perform experiments on Chicago Divvy Bicycle Sharing data and show that our algorithms significantly outperform an existing algorithm (a kernelized Perceptron) as well as several natural benchmarks.',
    pdf_url = 'https://arxiv.org/pdf/1806.06439v3.pdf',
    upload_timestamp = NULL
WHERE paper_id = 'P951';

-- Paper 21: P017 -> Compressed Sensing with Deep Image Prior and Learned Regular...
UPDATE Papers 
SET 
    paper_title = 'Compressed Sensing with Deep Image Prior and Learned Regularization',
    abstract = 'We propose a novel method for compressed sensing recovery using untrained deep generative models. Our method is based on the recently proposed Deep Image Prior (DIP), wherein the convolutional weights of the network are optimized to match the observed measurements. We show that this approach can be applied to solve any differentiable linear inverse problem, outperforming previous unlearned methods. Unlike various learned approaches based on generative models, our method does not require pre-training over large datasets. We further introduce a novel learned regularization technique, which incorporates prior information on the network weights. This reduces reconstruction error, especially for noisy measurements. Finally, we prove that, using the DIP optimization approach, moderately overparameterized single-layer networks can perfectly fit any signal despite the non-convex nature of the fitting problem. This theoretical result provides justification for early stopping.',
    pdf_url = 'https://arxiv.org/pdf/1806.06438v4.pdf',
    upload_timestamp = NULL
WHERE paper_id = 'P017';

-- Paper 22: P034 -> Subspace Embedding and Linear Regression with Orlicz Norm...
UPDATE Papers 
SET 
    paper_title = 'Subspace Embedding and Linear Regression with Orlicz Norm',
    abstract = 'We consider a generalization of the classic linear regression problem to the
case when the loss is an Orlicz norm. An Orlicz norm is parameterized by a
non-negative convex function $G:\\mathbb{R}_+\\rightarrow\\mathbb{R}_+$ with
$G(0)=0$: the Orlicz norm of a vector $x\\in\\mathbb{R}^n$ is defined as $
\\|x\\|_G=\\inf\\left\\{\\alpha>0\\large\\mid\\sum_{i=1}^n G(|x_i|/\\alpha)\\leq
1\\right\\}. $ We consider the cases where the function $G(\\cdot)$ grows
subquadratically. Our main result is based on a new oblivious embedding which
embeds the column space of a given matrix $A\\in\\mathbb{R}^{n\\times d}$ with
Orlicz norm into a lower dimensional space with $\\ell_2$ norm. Specifically, we
show how to efficiently find an embedding matrix $S\\in\\mathbb{R}^{m\\times
n},m<n$ such that $\\forall x\\in\\mathbb{R}^{d},\\Omega(1/(d\\log n)) \\cdot
\\|Ax\\|_G\\leq \\|SAx\\|_2\\leq O(d^2\\log n) \\cdot \\|Ax\\|_G.$ By applying this
subspace embedding technique, we show an approximation algorithm for the
regression problem $\\min_{x\\in\\mathbb{R}^d} \\|Ax-b\\|_G$, up to a $O(d\\log^2 n)$
factor. As a further application of our techniques, we show how to also use
them to improve on the algorithm for the $\\ell_p$ low rank matrix approximation
problem for $1\\leq p<2$.',
    pdf_url = 'http://arxiv.org/pdf/1806.06430v1.pdf',
    upload_timestamp = NULL
WHERE paper_id = 'P034';

-- Paper 23: P205 -> Scalable Methods for 8-bit Training of Neural Networks...
UPDATE Papers 
SET 
    paper_title = 'Scalable Methods for 8-bit Training of Neural Networks',
    abstract = 'Quantized Neural Networks (QNNs) are often used to improve network efficiency
during the inference phase, i.e. after the network has been trained. Extensive
research in the field suggests many different quantization schemes. Still, the
number of bits required, as well as the best quantization scheme, are yet
unknown. Our theoretical analysis suggests that most of the training process is
robust to substantial precision reduction, and points to only a few specific
operations that require higher precision. Armed with this knowledge, we
quantize the model parameters, activations and layer gradients to 8-bit,
leaving at a higher precision only the final step in the computation of the
weight gradients. Additionally, as QNNs require batch-normalization to be
trained at high precision, we introduce Range Batch-Normalization (BN) which
has significantly higher tolerance to quantization noise and improved
computational complexity. Our simulations show that Range BN is equivalent to
the traditional batch norm if a precise scale adjustment, which can be
approximated analytically, is applied. To the best of the authors'' knowledge,
this work is the first to quantize the weights, activations, as well as a
substantial volume of the gradients stream, in all layers (including batch
normalization) to 8-bit while showing state-of-the-art results over the
ImageNet-1K dataset.',
    pdf_url = 'http://arxiv.org/pdf/1805.11046v3.pdf',
    upload_timestamp = NULL
WHERE paper_id = 'P205';

-- Paper 24: P509 -> Learning to Evaluate Image Captioning...
UPDATE Papers 
SET 
    paper_title = 'Learning to Evaluate Image Captioning',
    abstract = 'Evaluation metrics for image captioning face two challenges. Firstly,
commonly used metrics such as CIDEr, METEOR, ROUGE and BLEU often do not
correlate well with human judgments. Secondly, each metric has well known blind
spots to pathological caption constructions, and rule-based metrics lack
provisions to repair such blind spots once identified. For example, the newly
proposed SPICE correlates well with human judgments, but fails to capture the
syntactic structure of a sentence. To address these two challenges, we propose
a novel learning based discriminative evaluation metric that is directly
trained to distinguish between human and machine-generated captions. In
addition, we further propose a data augmentation scheme to explicitly
incorporate pathological transformations as negative examples during training.
The proposed metric is evaluated with three kinds of robustness tests and its
correlation with human judgments. Extensive experiments show that the proposed
data augmentation scheme not only makes our metric more robust toward several
pathological transformations, but also improves its correlation with human
judgments. Our metric outperforms other metrics on both caption level human
correlation in Flickr 8k and system level human correlation in COCO. The
proposed approach could be served as a learning based evaluation metric that is
complementary to existing rule-based metrics.',
    pdf_url = 'http://arxiv.org/pdf/1806.06422v1.pdf',
    upload_timestamp = NULL
WHERE paper_id = 'P509';

-- Paper 25: P774 -> High-speed Tracking with Multi-kernel Correlation Filters...
UPDATE Papers 
SET 
    paper_title = 'High-speed Tracking with Multi-kernel Correlation Filters',
    abstract = 'Correlation filter (CF) based trackers are currently ranked top in terms of
their performances. Nevertheless, only some of them, such as
KCF~\\cite{henriques15} and MKCF~\\cite{tangm15}, are able to exploit the
powerful discriminability of non-linear kernels. Although MKCF achieves more
powerful discriminability than KCF through introducing multi-kernel learning
(MKL) into KCF, its improvement over KCF is quite limited and its computational
burden increases significantly in comparison with KCF. In this paper, we will
introduce the MKL into KCF in a different way than MKCF. We reformulate the MKL
version of CF objective function with its upper bound, alleviating the negative
mutual interference of different kernels significantly. Our novel MKCF tracker,
MKCFup, outperforms KCF and MKCF with large margins and can still work at very
high fps. Extensive experiments on public datasets show that our method is
superior to state-of-the-art algorithms for target objects of small move at
very high speed.',
    pdf_url = 'http://arxiv.org/pdf/1806.06418v1.pdf',
    upload_timestamp = NULL
WHERE paper_id = 'P774';

-- Paper 26: P454 -> Gated Path Planning Networks...
UPDATE Papers 
SET 
    paper_title = 'Gated Path Planning Networks',
    abstract = 'Value Iteration Networks (VINs) are effective differentiable path planning
modules that can be used by agents to perform navigation while still
maintaining end-to-end differentiability of the entire architecture. Despite
their effectiveness, they suffer from several disadvantages including training
instability, random seed sensitivity, and other optimization problems. In this
work, we reframe VINs as recurrent-convolutional networks which demonstrates
that VINs couple recurrent convolutions with an unconventional max-pooling
activation. From this perspective, we argue that standard gated recurrent
update equations could potentially alleviate the optimization issues plaguing
VIN. The resulting architecture, which we call the Gated Path Planning Network,
is shown to empirically outperform VIN on a variety of metrics such as learning
speed, hyperparameter sensitivity, iteration count, and even generalization.
Furthermore, we show that this performance gap is consistent across different
maze transition types, maze sizes and even show success on a challenging 3D
environment, where the planner is only provided with first-person RGB images.',
    pdf_url = 'http://arxiv.org/pdf/1806.06408v1.pdf',
    upload_timestamp = NULL
WHERE paper_id = 'P454';

-- Paper 27: P264 -> Multimodal Grounding for Language Processing...
UPDATE Papers 
SET 
    paper_title = 'Multimodal Grounding for Language Processing',
    abstract = 'This survey discusses how recent developments in multimodal processing facilitate conceptual grounding of language. We categorize the information flow in multimodal processing with respect to cognitive models of human information processing and analyze different methods for combining multimodal representations. Based on this methodological inventory, we discuss the benefit of multimodal grounding for a variety of language processing tasks and the challenges that arise. We particularly focus on multimodal grounding of verbs which play a crucial role for the compositional power of language.',
    pdf_url = 'https://arxiv.org/pdf/1806.06371v2.pdf',
    upload_timestamp = NULL
WHERE paper_id = 'P264';

-- Paper 28: P612 -> Initialization of ReLUs for Dynamical Isometry...
UPDATE Papers 
SET 
    paper_title = 'Initialization of ReLUs for Dynamical Isometry',
    abstract = 'Deep learning relies on good initialization schemes and hyperparameter choices prior to training a neural network. Random weight initializations induce random network ensembles, which give rise to the trainability, training speed, and sometimes also generalization ability of an instance. In addition, such ensembles provide theoretical insights into the space of candidate models of which one is selected during training. The results obtained so far rely on mean field approximations that assume infinite layer width and that study average squared signals. We derive the joint signal output distribution exactly, without mean field assumptions, for fully-connected networks with Gaussian weights and biases, and analyze deviations from the mean field results. For rectified linear units, we further discuss limitations of the standard initialization scheme, such as its lack of dynamical isometry, and propose a simple alternative that overcomes these by initial parameter sharing.',
    pdf_url = 'https://arxiv.org/pdf/1806.06362v3.pdf',
    upload_timestamp = NULL
WHERE paper_id = 'P612';

-- Paper 29: P822 -> Incorporating Chinese Characters of Words for Lexical Sememe...
UPDATE Papers 
SET 
    paper_title = 'Incorporating Chinese Characters of Words for Lexical Sememe Prediction',
    abstract = 'Sememes are minimum semantic units of concepts in human languages, such that
each word sense is composed of one or multiple sememes. Words are usually
manually annotated with their sememes by linguists, and form linguistic
common-sense knowledge bases widely used in various NLP tasks. Recently, the
lexical sememe prediction task has been introduced. It consists of
automatically recommending sememes for words, which is expected to improve
annotation efficiency and consistency. However, existing methods of lexical
sememe prediction typically rely on the external context of words to represent
the meaning, which usually fails to deal with low-frequency and
out-of-vocabulary words. To address this issue for Chinese, we propose a novel
framework to take advantage of both internal character information and external
context information of words. We experiment on HowNet, a Chinese sememe
knowledge base, and demonstrate that our framework outperforms state-of-the-art
baselines by a large margin, and maintains a robust performance even for
low-frequency words.',
    pdf_url = 'http://arxiv.org/pdf/1806.06349v1.pdf',
    upload_timestamp = NULL
WHERE paper_id = 'P822';

-- Paper 30: P709 -> Deep Neural Nets with Interpolating Function as Output Activ...
UPDATE Papers 
SET 
    paper_title = 'Deep Neural Nets with Interpolating Function as Output Activation',
    abstract = 'We replace the output layer of deep neural nets, typically the softmax
function, by a novel interpolating function. And we propose end-to-end training
and testing algorithms for this new architecture. Compared to classical neural
nets with softmax function as output activation, the surrogate with
interpolating function as output activation combines advantages of both deep
and manifold learning. The new framework demonstrates the following major
advantages: First, it is better applicable to the case with insufficient
training data. Second, it significantly improves the generalization accuracy on
a wide variety of networks. The algorithm is implemented in PyTorch, and code
will be made publicly available.',
    pdf_url = 'http://arxiv.org/pdf/1802.00168v3.pdf',
    upload_timestamp = NULL
WHERE paper_id = 'P709';


-- Verify the updates
SELECT paper_id, paper_title, upload_timestamp FROM Papers ORDER BY upload_timestamp DESC LIMIT 10;
