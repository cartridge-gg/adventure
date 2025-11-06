pub mod systems {
    pub mod actions;
}

pub mod models;

pub mod token {
    pub mod map;
    pub mod svg;
}

pub mod verifiers {
    pub mod interface;
    pub mod minimum_score;
}

#[cfg(test)]
mod tests {
    mod actions;
    mod mocks;
    mod svg;
}
