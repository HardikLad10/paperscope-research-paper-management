-- Update U001's 'My Papers' with real arXiv data from papers_v2.csv
-- Using papers 31-46 from CSV

-- Paper 1: P490 -> Laplacian Smoothing Gradient Descent...
UPDATE Papers 
SET 
    paper_title = 'Laplacian Smoothing Gradient Descent',
    abstract = 'We propose a class of very simple modifications of gradient descent and
stochastic gradient descent. We show that when applied to a large variety of
machine learning problems, ranging from logistic regression to deep neural
nets, the proposed surrogates can dramatically reduce the variance, allow to
take a larger step size, and improve the generalization accuracy. The methods
only involve multiplying the usual (stochastic) gradient by the inverse of a
positive definitive matrix (which can be computed efficiently by FFT) with a
low condition number coming from a one-dimensional discrete Laplacian or its
high order generalizations. It also preserves the mean and increases the
smallest component and decreases the largest component. The theory of
Hamilton-Jacobi partial differential equations demonstrates that the implicit
version of the new algorithm is almost the same as doing gradient descent on a
new function which (i) has the same global minima as the original function and
(ii) is ``more convex". Moreover, we show that optimization algorithms with
these surrogates converge uniformly in the discrete Sobolev $H_\\sigma^p$ sense
and reduce the optimality gap for convex optimization problems. The code is
available at:
\\url{https://github.com/BaoWangMath/LaplacianSmoothing-GradientDescent}',
    pdf_url = 'http://arxiv.org/pdf/1806.06317v5.pdf',
    upload_timestamp = NOW()
WHERE paper_id = 'P490';

-- Paper 2: P898 -> Minimal I-MAP MCMC for Scalable Structure Discovery in Causa...
UPDATE Papers 
SET 
    paper_title = 'Minimal I-MAP MCMC for Scalable Structure Discovery in Causal DAG Models',
    abstract = 'Learning a Bayesian network (BN) from data can be useful for decision-making
or discovering causal relationships. However, traditional methods often fail in
modern applications, which exhibit a larger number of observed variables than
data points. The resulting uncertainty about the underlying network as well as
the desire to incorporate prior information recommend a Bayesian approach to
learning the BN, but the highly combinatorial structure of BNs poses a striking
challenge for inference. The current state-of-the-art methods such as order
MCMC are faster than previous methods but prevent the use of many natural
structural priors and still have running time exponential in the maximum
indegree of the true directed acyclic graph (DAG) of the BN. We here propose an
alternative posterior approximation based on the observation that, if we
incorporate empirical conditional independence tests, we can focus on a
high-probability DAG associated with each order of the vertices. We show that
our method allows the desired flexibility in prior specification, removes
timing dependence on the maximum indegree and yields provably good posterior
approximations; in addition, we show that it achieves superior accuracy,
scalability, and sampler mixing on several datasets.',
    pdf_url = 'http://arxiv.org/pdf/1803.05554v3.pdf',
    upload_timestamp = NOW()
WHERE paper_id = 'P898';

-- Paper 3: P127 -> Latent Convolutional Models...
UPDATE Papers 
SET 
    paper_title = 'Latent Convolutional Models',
    abstract = 'We present a new latent model of natural images that can be learned on
large-scale datasets. The learning process provides a latent embedding for
every image in the training dataset, as well as a deep convolutional network
that maps the latent space to the image space. After training, the new model
provides a strong and universal image prior for a variety of image restoration
tasks such as large-hole inpainting, superresolution, and colorization. To
model high-resolution natural images, our approach uses latent spaces of very
high dimensionality (one to two orders of magnitude higher than previous latent
image models). To tackle this high dimensionality, we use latent spaces with a
special manifold structure (convolutional manifolds) parameterized by a ConvNet
of a certain architecture. In the experiments, we compare the learned latent
models with latent models learned by autoencoders, advanced variants of
generative adversarial networks, and a strong baseline system using simpler
parameterization of the latent space. Our model outperforms the competing
approaches over a range of restoration tasks.',
    pdf_url = 'http://arxiv.org/pdf/1806.06284v2.pdf',
    upload_timestamp = NOW()
WHERE paper_id = 'P127';

-- Paper 4: P653 -> Retrofitting Distributional Embeddings to Knowledge Graphs w...
UPDATE Papers 
SET 
    paper_title = 'Retrofitting Distributional Embeddings to Knowledge Graphs with Functional Relations',
    abstract = 'Knowledge graphs are a versatile framework to encode richly structured data
relationships, but it can be challenging to combine these graphs with
unstructured data. Methods for retrofitting pre-trained entity representations
to the structure of a knowledge graph typically assume that entities are
embedded in a connected space and that relations imply similarity. However,
useful knowledge graphs often contain diverse entities and relations (with
potentially disjoint underlying corpora) which do not accord with these
assumptions. To overcome these limitations, we present Functional Retrofitting,
a framework that generalizes current retrofitting methods by explicitly
modeling pairwise relations. Our framework can directly incorporate a variety
of pairwise penalty functions previously developed for knowledge graph
completion. Further, it allows users to encode, learn, and extract information
about relation semantics. We present both linear and neural instantiations of
the framework. Functional Retrofitting significantly outperforms existing
retrofitting methods on complex knowledge graphs and loses no accuracy on
simpler graphs (in which relations do imply similarity). Finally, we
demonstrate the utility of the framework by predicting new drug--disease
treatment pairs in a large, complex health knowledge graph.',
    pdf_url = 'http://arxiv.org/pdf/1708.00112v3.pdf',
    upload_timestamp = NOW()
WHERE paper_id = 'P653';

-- Paper 5: P022 -> GILE: A Generalized Input-Label Embedding for Text Classific...
UPDATE Papers 
SET 
    paper_title = 'GILE: A Generalized Input-Label Embedding for Text Classification',
    abstract = 'Neural text classification models typically treat output labels as
categorical variables which lack description and semantics. This forces their
parametrization to be dependent on the label set size, and, hence, they are
unable to scale to large label sets and generalize to unseen ones. Existing
joint input-label text models overcome these issues by exploiting label
descriptions, but they are unable to capture complex label relationships, have
rigid parametrization, and their gains on unseen labels happen often at the
expense of weak performance on the labels seen during training. In this paper,
we propose a new input-label model which generalizes over previous such models,
addresses their limitations and does not compromise performance on seen labels.
The model consists of a joint non-linear input-label embedding with
controllable capacity and a joint-space-dependent classification unit which is
trained with cross-entropy loss to optimize classification performance. We
evaluate models on full-resource and low- or zero-resource text classification
of multilingual news and biomedical text with a large label set. Our model
outperforms monolingual and multilingual models which do not leverage label
semantics and previous joint input-label space models in both scenarios.',
    pdf_url = 'http://arxiv.org/pdf/1806.06219v3.pdf',
    upload_timestamp = NOW()
WHERE paper_id = 'P022';

-- Paper 6: P237 -> Natasha: Faster Non-Convex Stochastic Optimization Via Stron...
UPDATE Papers 
SET 
    paper_title = 'Natasha: Faster Non-Convex Stochastic Optimization Via Strongly Non-Convex Parameter',
    abstract = 'Given a nonconvex function that is an average of $n$ smooth functions, we
design stochastic first-order methods to find its approximate stationary
points. The convergence of our new methods depends on the smallest (negative)
eigenvalue $-\\sigma$ of the Hessian, a parameter that describes how nonconvex
the function is.
  Our methods outperform known results for a range of parameter $\\sigma$, and
can be used to find approximate local minima. Our result implies an interesting
dichotomy: there exists a threshold $\\sigma_0$ so that the currently fastest
methods for $\\sigma>\\sigma_0$ and for $\\sigma<\\sigma_0$ have different
behaviors: the former scales with $n^{2/3}$ and the latter scales with
$n^{3/4}$.',
    pdf_url = 'http://arxiv.org/pdf/1702.00763v5.pdf',
    upload_timestamp = NOW()
WHERE paper_id = 'P237';

-- Paper 7: P652 -> Learning towards Minimum Hyperspherical Energy...
UPDATE Papers 
SET 
    paper_title = 'Learning towards Minimum Hyperspherical Energy',
    abstract = 'Neural networks are a powerful class of nonlinear functions that can be trained end-to-end on various applications. While the over-parametrization nature in many neural networks renders the ability to fit complex functions and the strong representation power to handle challenging tasks, it also leads to highly correlated neurons that can hurt the generalization ability and incur unnecessary computation cost. As a result, how to regularize the network to avoid undesired representation redundancy becomes an important issue. To this end, we draw inspiration from a well-known problem in physics -- Thomson problem, where one seeks to find a state that distributes N electrons on a unit sphere as evenly as possible with minimum potential energy. In light of this intuition, we reduce the redundancy regularization problem to generic energy minimization, and propose a minimum hyperspherical energy (MHE) objective as generic regularization for neural networks. We also propose a few novel variants of MHE, and provide some insights from a theoretical point of view. Finally, we apply neural networks with MHE regularization to several challenging tasks. Extensive experiments demonstrate the effectiveness of our intuition, by showing the superior performance with MHE regularization.',
    pdf_url = 'https://arxiv.org/pdf/1805.09298v9.pdf',
    upload_timestamp = NOW()
WHERE paper_id = 'P652';

-- Paper 8: P752 -> Large Scale Fine-Grained Categorization and Domain-Specific ...
UPDATE Papers 
SET 
    paper_title = 'Large Scale Fine-Grained Categorization and Domain-Specific Transfer Learning',
    abstract = 'Transferring the knowledge learned from large scale datasets (e.g., ImageNet)
via fine-tuning offers an effective solution for domain-specific fine-grained
visual categorization (FGVC) tasks (e.g., recognizing bird species or car make
and model). In such scenarios, data annotation often calls for specialized
domain knowledge and thus is difficult to scale. In this work, we first tackle
a problem in large scale FGVC. Our method won first place in iNaturalist 2017
large scale species classification challenge. Central to the success of our
approach is a training scheme that uses higher image resolution and deals with
the long-tailed distribution of training data. Next, we study transfer learning
via fine-tuning from large scale datasets to small scale, domain-specific FGVC
datasets. We propose a measure to estimate domain similarity via Earth Mover''s
Distance and demonstrate that transfer learning benefits from pre-training on a
source domain that is similar to the target domain by this measure. Our
proposed transfer learning outperforms ImageNet pre-training and obtains
state-of-the-art results on multiple commonly used FGVC datasets.',
    pdf_url = 'http://arxiv.org/pdf/1806.06193v1.pdf',
    upload_timestamp = NOW()
WHERE paper_id = 'P752';

-- Paper 9: P835 -> Orthogonal Machine Learning: Power and Limitations...
UPDATE Papers 
SET 
    paper_title = 'Orthogonal Machine Learning: Power and Limitations',
    abstract = 'Double machine learning provides $\\sqrt{n}$-consistent estimates of
parameters of interest even when high-dimensional or nonparametric nuisance
parameters are estimated at an $n^{-1/4}$ rate. The key is to employ
Neyman-orthogonal moment equations which are first-order insensitive to
perturbations in the nuisance parameters. We show that the $n^{-1/4}$
requirement can be improved to $n^{-1/(2k+2)}$ by employing a $k$-th order
notion of orthogonality that grants robustness to more complex or
higher-dimensional nuisance parameters. In the partially linear regression
setting popular in causal inference, we show that we can construct second-order
orthogonal moments if and only if the treatment residual is not normally
distributed. Our proof relies on Stein''s lemma and may be of independent
interest. We conclude by demonstrating the robustness benefits of an explicit
doubly-orthogonal estimation procedure for treatment effect.',
    pdf_url = 'http://arxiv.org/pdf/1711.00342v6.pdf',
    upload_timestamp = NOW()
WHERE paper_id = 'P835';

-- Paper 10: P883 -> Learning Factorized Multimodal Representations...
UPDATE Papers 
SET 
    paper_title = 'Learning Factorized Multimodal Representations',
    abstract = 'Learning multimodal representations is a fundamentally complex research problem due to the presence of multiple heterogeneous sources of information. Although the presence of multiple modalities provides additional valuable information, there are two key challenges to address when learning from multimodal data: 1) models must learn the complex intra-modal and cross-modal interactions for prediction and 2) models must be robust to unexpected missing or noisy modalities during testing. In this paper, we propose to optimize for a joint generative-discriminative objective across multimodal data and labels. We introduce a model that factorizes representations into two sets of independent factors: multimodal discriminative and modality-specific generative factors. Multimodal discriminative factors are shared across all modalities and contain joint multimodal features required for discriminative tasks such as sentiment prediction. Modality-specific generative factors are unique for each modality and contain the information required for generating data. Experimental results show that our model is able to learn meaningful multimodal representations that achieve state-of-the-art or competitive performance on six multimodal datasets. Our model demonstrates flexible generative capabilities by conditioning on independent factors and can reconstruct missing modalities without significantly impacting performance. Lastly, we interpret our factorized representations to understand the interactions that influence multimodal learning.',
    pdf_url = 'https://arxiv.org/pdf/1806.06176v3.pdf',
    upload_timestamp = NOW()
WHERE paper_id = 'P883';

-- Paper 11: P945 -> Revisiting Deep Intrinsic Image Decompositions...
UPDATE Papers 
SET 
    paper_title = 'Revisiting Deep Intrinsic Image Decompositions',
    abstract = 'While invaluable for many computer vision applications, decomposing a natural
image into intrinsic reflectance and shading layers represents a challenging,
underdetermined inverse problem. As opposed to strict reliance on conventional
optimization or filtering solutions with strong prior assumptions, deep
learning based approaches have also been proposed to compute intrinsic image
decompositions when granted access to sufficient labeled training data. The
downside is that current data sources are quite limited, and broadly speaking
fall into one of two categories: either dense fully-labeled images in
synthetic/narrow settings, or weakly-labeled data from relatively diverse
natural scenes. In contrast to many previous learning-based approaches, which
are often tailored to the structure of a particular dataset (and may not work
well on others), we adopt core network structures that universally reflect
loose prior knowledge regarding the intrinsic image formation process and can
be largely shared across datasets. We then apply flexibly supervised loss
layers that are customized for each source of ground truth labels. The
resulting deep architecture achieves state-of-the-art results on all of the
major intrinsic image benchmarks, and runs considerably faster than most at
test time.',
    pdf_url = 'http://arxiv.org/pdf/1701.02965v8.pdf',
    upload_timestamp = NOW()
WHERE paper_id = 'P945';

-- Paper 12: P578 -> Discrete Sequential Prediction of Continuous Actions for Dee...
UPDATE Papers 
SET 
    paper_title = 'Discrete Sequential Prediction of Continuous Actions for Deep RL',
    abstract = 'It has long been assumed that high dimensional continuous control problems cannot be solved effectively by discretizing individual dimensions of the action space due to the exponentially large number of bins over which policies would have to be learned. In this paper, we draw inspiration from the recent success of sequence-to-sequence models for structured prediction problems to develop policies over discretized spaces. Central to this method is the realization that complex functions over high dimensional spaces can be modeled by neural networks that predict one dimension at a time. Specifically, we show how Q-values and policies over continuous spaces can be modeled using a next step prediction model over discretized dimensions. With this parameterization, it is possible to both leverage the compositional structure of action spaces during learning, as well as compute maxima over action spaces (approximately). On a simple example task we demonstrate empirically that our method can perform global search, which effectively gets around the local optimization issues that plague DDPG. We apply the technique to off-policy (Q-learning) methods and show that our method can achieve the state-of-the-art for off-policy methods on several continuous control tasks.',
    pdf_url = 'https://arxiv.org/pdf/1705.05035v3.pdf',
    upload_timestamp = NOW()
WHERE paper_id = 'P578';

-- Paper 13: P585 -> Object Level Visual Reasoning in Videos...
UPDATE Papers 
SET 
    paper_title = 'Object Level Visual Reasoning in Videos',
    abstract = 'Human activity recognition is typically addressed by detecting key concepts
like global and local motion, features related to object classes present in the
scene, as well as features related to the global context. The next open
challenges in activity recognition require a level of understanding that pushes
beyond this and call for models with capabilities for fine distinction and
detailed comprehension of interactions between actors and objects in a scene.
We propose a model capable of learning to reason about semantically meaningful
spatiotemporal interactions in videos. The key to our approach is a choice of
performing this reasoning at the object level through the integration of state
of the art object detection networks. This allows the model to learn detailed
spatial interactions that exist at a semantic, object-interaction relevant
level. We evaluate our method on three standard datasets (Twenty-BN
Something-Something, VLOG and EPIC Kitchens) and achieve state of the art
results on all of them. Finally, we show visualizations of the interactions
learned by the model, which illustrate object classes and their interactions
corresponding to different activity classes.',
    pdf_url = 'http://arxiv.org/pdf/1806.06157v3.pdf',
    upload_timestamp = NOW()
WHERE paper_id = 'P585';

-- Paper 14: P354 -> Knowledge-enriched Two-layered Attention Network for Sentime...
UPDATE Papers 
SET 
    paper_title = 'Knowledge-enriched Two-layered Attention Network for Sentiment Analysis',
    abstract = 'We propose a novel two-layered attention network based on Bidirectional Long
Short-Term Memory for sentiment analysis. The novel two-layered attention
network takes advantage of the external knowledge bases to improve the
sentiment prediction. It uses the Knowledge Graph Embedding generated using the
WordNet. We build our model by combining the two-layered attention network with
the supervised model based on Support Vector Regression using a Multilayer
Perceptron network for sentiment analysis. We evaluate our model on the
benchmark dataset of SemEval 2017 Task 5. Experimental results show that the
proposed model surpasses the top system of SemEval 2017 Task 5. The model
performs significantly better by improving the state-of-the-art system at
SemEval 2017 Task 5 by 1.7 and 3.7 points for sub-tracks 1 and 2 respectively.',
    pdf_url = 'http://arxiv.org/pdf/1805.07819v4.pdf',
    upload_timestamp = NOW()
WHERE paper_id = 'P354';

-- Paper 15: P878 -> Image Transformer...
UPDATE Papers 
SET 
    paper_title = 'Image Transformer',
    abstract = 'Image generation has been successfully cast as an autoregressive sequence
generation or transformation problem. Recent work has shown that self-attention
is an effective way of modeling textual sequences. In this work, we generalize
a recently proposed model architecture based on self-attention, the
Transformer, to a sequence modeling formulation of image generation with a
tractable likelihood. By restricting the self-attention mechanism to attend to
local neighborhoods we significantly increase the size of images the model can
process in practice, despite maintaining significantly larger receptive fields
per layer than typical convolutional neural networks. While conceptually
simple, our generative models significantly outperform the current state of the
art in image generation on ImageNet, improving the best published negative
log-likelihood on ImageNet from 3.83 to 3.77. We also present results on image
super-resolution with a large magnification ratio, applying an encoder-decoder
configuration of our architecture. In a human evaluation study, we find that
images generated by our super-resolution model fool human observers three times
more often than the previous state of the art.',
    pdf_url = 'http://arxiv.org/pdf/1802.05751v3.pdf',
    upload_timestamp = NOW()
WHERE paper_id = 'P878';

-- Paper 16: P240 -> Characterizing Departures from Linearity in Word Translation...
UPDATE Papers 
SET 
    paper_title = 'Characterizing Departures from Linearity in Word Translation',
    abstract = 'We investigate the behavior of maps learned by machine translation methods.
The maps translate words by projecting between word embedding spaces of
different languages. We locally approximate these maps using linear maps, and
find that they vary across the word embedding space. This demonstrates that the
underlying maps are non-linear. Importantly, we show that the locally linear
maps vary by an amount that is tightly correlated with the distance between the
neighborhoods on which they are trained. Our results can be used to test
non-linear methods, and to drive the design of more accurate maps for word
translation.',
    pdf_url = 'http://arxiv.org/pdf/1806.04508v2.pdf',
    upload_timestamp = NOW()
WHERE paper_id = 'P240';


-- Verify U001's papers
SELECT p.paper_id, p.paper_title, p.upload_timestamp
FROM Papers p
INNER JOIN Authorship a ON p.paper_id = a.paper_id
WHERE a.user_id = 'U001'
ORDER BY p.upload_timestamp DESC
LIMIT 10;
