# Published pipeline, in five sentences

1. `ForYouCandidatePipeline` wraps `PhoenixCandidatePipeline` for feed blending and ranking. Citation: `home-mixer/server.rs:878-896`.
2. Candidates arrive in parallel from Thunder, Phoenix retrieval, Phoenix topics, and SimClusters ANN; TweetMixer and Phoenix MoE are off by default. Citation: `home-mixer/candidate_pipeline/phoenix_candidate_pipeline.rs:315-323`; `home-mixer/params/param.rs:11-14,42-52,135-138`.
3. Seventeen pre-scoring filters run in fixed order, followed by PhoenixScorer, RankingScorer, and VMRanker DPP reranking. Citation: `home-mixer/candidate_pipeline/phoenix_candidate_pipeline.rs:344-396`.
4. `TopKScoreSelector` keeps 50 candidates, then visibility filtering and conversation dedup run. Citation: `home-mixer/candidate_pipeline/phoenix_candidate_pipeline.rs:398-421`; `home-mixer/params/config.rs:17`.
5. Asynchronous safety and labeling systems write labels that visibility filtering reads at request time, so ranking and visibility are separate systems. Citation: repository `README.md:155-214,451-453`.

Do not infer unpublished storage systems, ANN implementation, candidate counts beyond cited constants, or content-reading behavior from this summary.
